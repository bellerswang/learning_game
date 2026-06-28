const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const screens = {
    start: document.getElementById('start-screen'),
    pause: document.getElementById('pause-screen'),
    result: document.getElementById('result-screen'),
    collection: document.getElementById('collection-screen')
};

const ui = {
    score: document.getElementById('score'),
    level: document.getElementById('level'),
    timer: document.getElementById('timer'),
    hearts: document.getElementById('hearts'),
    combo: document.getElementById('combo'),
    toast: document.getElementById('toast'),
    homeLevel: document.getElementById('home-level'),
    homeCoins: document.getElementById('home-coins'),
    homeBest: document.getElementById('home-best'),
    homeXpFill: document.getElementById('home-xp-fill'),
    resultTitle: document.getElementById('result-title'),
    resultStars: document.getElementById('result-stars'),
    resultScore: document.getElementById('result-score'),
    resultCoins: document.getElementById('result-coins'),
    resultXp: document.getElementById('result-xp'),
    resultBest: document.getElementById('result-best'),
    resultXpFill: document.getElementById('result-xp-fill'),
    unlockMessage: document.getElementById('unlock-message'),
    shapeCollection: document.getElementById('shape-collection'),
    backgroundCollection: document.getElementById('background-collection')
};

const STORAGE_KEY = 'magicToolbox.fallingFriends.progress';
const ROUND_SECONDS = 60;
const MAX_HEARTS = 5;
const SHAPE_UNLOCK_LEVELS = {
    bubble: 1,
    lion: 1,
    jellyfish: 2,
    shell: 3,
    star: 4
};
const BACKGROUND_UNLOCK_LEVELS = {
    rainbow: 1,
    ocean: 3,
    jungle: 5
};
const SHAPE_LABELS = {
    bubble: 'Bubble',
    lion: 'Lion',
    jellyfish: 'Jellyfish',
    shell: 'Shell',
    star: 'Star'
};
const SHAPE_ICONS = {
    bubble: 'Bubble',
    lion: 'Lion',
    jellyfish: 'Jelly',
    shell: 'Shell',
    star: 'Star'
};
const BACKGROUND_LABELS = {
    rainbow: 'Rainbow Sky',
    ocean: 'Ocean Glow',
    jungle: 'Jungle Morning'
};

const game = {
    state: 'start',
    width: 0,
    height: 0,
    dpr: 1,
    score: 0,
    hearts: MAX_HEARTS,
    combo: 0,
    timeLeft: ROUND_SECONDS,
    targets: [],
    particles: [],
    lastTime: 0,
    spawnTimer: 0,
    elapsed: 0,
    hits: 0,
    misses: 0
};

const defaultProgress = {
    level: 1,
    xp: 0,
    coins: 0,
    bestScore: 0,
    unlockedShapes: ['bubble', 'lion'],
    unlockedBackgrounds: ['rainbow'],
    selectedBackground: 'rainbow'
};

let progress = loadProgress();

function createDefaultProgress() {
    return {
        ...defaultProgress,
        unlockedShapes: [...defaultProgress.unlockedShapes],
        unlockedBackgrounds: [...defaultProgress.unlockedBackgrounds]
    };
}

function loadProgress() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return normalizeProgress(saved);
    } catch (error) {
        return createDefaultProgress();
    }
}

function normalizeProgress(saved) {
    const base = { ...defaultProgress, ...(saved || {}) };
    base.unlockedShapes = Array.from(new Set([...(base.unlockedShapes || []), 'bubble', 'lion']));
    base.unlockedBackgrounds = Array.from(new Set([...(base.unlockedBackgrounds || []), 'rainbow']));
    if (!base.unlockedBackgrounds.includes(base.selectedBackground)) {
        base.selectedBackground = 'rainbow';
    }
    return base;
}

function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function xpNeeded(level = progress.level) {
    return 120 + (level - 1) * 40;
}

function resizeCanvas() {
    game.dpr = Math.min(window.devicePixelRatio || 1, 2);
    game.width = window.innerWidth;
    game.height = window.innerHeight;
    canvas.width = Math.floor(game.width * game.dpr);
    canvas.height = Math.floor(game.height * game.dpr);
    canvas.style.width = `${game.width}px`;
    canvas.style.height = `${game.height}px`;
    ctx.setTransform(game.dpr, 0, 0, game.dpr, 0, 0);
}

function showScreen(name) {
    Object.values(screens).forEach((screen) => screen.classList.remove('active'));
    if (screens[name]) screens[name].classList.add('active');
}

function startRound() {
    game.state = 'playing';
    game.score = 0;
    game.hearts = MAX_HEARTS;
    game.combo = 0;
    game.timeLeft = ROUND_SECONDS;
    game.targets = [];
    game.particles = [];
    game.spawnTimer = 0;
    game.elapsed = 0;
    game.hits = 0;
    game.misses = 0;
    game.lastTime = performance.now();
    showScreen(null);
    updateHud();
    requestAnimationFrame(loop);
}

function pauseRound() {
    if (game.state !== 'playing') return;
    game.state = 'paused';
    showScreen('pause');
}

function resumeRound() {
    if (game.state !== 'paused') return;
    game.state = 'playing';
    game.lastTime = performance.now();
    showScreen(null);
    requestAnimationFrame(loop);
}

function finishRound() {
    if (game.state === 'result') return;
    game.state = 'result';

    const stars = calculateStars();
    const earnedCoins = Math.max(3, Math.round(game.score / 80) + stars * 4);
    const earnedXp = Math.max(12, Math.round(game.score / 6) + stars * 25 + game.hits * 2);
    const unlocks = [];

    progress.coins += earnedCoins;
    progress.xp += earnedXp;
    progress.bestScore = Math.max(progress.bestScore, game.score);

    while (progress.xp >= xpNeeded(progress.level)) {
        progress.xp -= xpNeeded(progress.level);
        progress.level += 1;
        unlocks.push(...applyUnlocksForLevel(progress.level));
    }

    saveProgress();
    updateHome();
    renderCollection();
    renderResults(stars, earnedCoins, earnedXp, unlocks);
    showScreen('result');
}

function applyUnlocksForLevel(level) {
    const messages = [];
    Object.entries(SHAPE_UNLOCK_LEVELS).forEach(([shape, unlockLevel]) => {
        if (level >= unlockLevel && !progress.unlockedShapes.includes(shape)) {
            progress.unlockedShapes.push(shape);
            messages.push(`${SHAPE_LABELS[shape]} joined!`);
        }
    });
    Object.entries(BACKGROUND_UNLOCK_LEVELS).forEach(([background, unlockLevel]) => {
        if (level >= unlockLevel && !progress.unlockedBackgrounds.includes(background)) {
            progress.unlockedBackgrounds.push(background);
            messages.push(`${BACKGROUND_LABELS[background]} unlocked!`);
        }
    });
    return messages;
}

function calculateStars() {
    if (game.score >= 900 || game.hits >= 45) return 3;
    if (game.score >= 450 || game.hits >= 24) return 2;
    return 1;
}

function loop(now) {
    if (game.state !== 'playing') return;
    const dt = Math.min((now - game.lastTime) / 1000, 0.033);
    game.lastTime = now;
    game.elapsed += dt;
    game.timeLeft = Math.max(0, ROUND_SECONDS - game.elapsed);

    updateGame(dt);
    drawGame();
    updateHud();

    if (game.timeLeft <= 0 || game.hearts <= 0) {
        finishRound();
        return;
    }

    requestAnimationFrame(loop);
}

function updateGame(dt) {
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
        spawnTarget();
        const levelBoost = Math.min(progress.level * 0.018, 0.16);
        game.spawnTimer = Math.max(0.34, 0.92 - levelBoost - game.elapsed / 180);
    }

    game.targets.forEach((target) => {
        target.y += target.speed * dt;
        target.spin += target.spinSpeed * dt;
        target.wobble += dt * target.wobbleSpeed;
    });

    for (let index = game.targets.length - 1; index >= 0; index -= 1) {
        const target = game.targets[index];
        if (target.y - target.radius > game.height + 20) {
            game.targets.splice(index, 1);
            game.hearts -= 1;
            game.combo = 0;
            game.misses += 1;
            showToast('Try the next one!');
        }
    }

    game.particles.forEach((particle) => {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 240 * dt;
        particle.life -= dt;
    });
    game.particles = game.particles.filter((particle) => particle.life > 0);
}

function spawnTarget() {
    const shapes = progress.unlockedShapes.length ? progress.unlockedShapes : ['bubble', 'lion'];
    const type = shapes[Math.floor(Math.random() * shapes.length)];
    const radius = Math.max(30, Math.min(52, game.width * 0.105)) + Math.random() * 10;
    const speed = 82 + progress.level * 7 + game.elapsed * 0.9 + Math.random() * 36;
    game.targets.push({
        type,
        x: radius + Math.random() * Math.max(1, game.width - radius * 2),
        y: -radius - Math.random() * 120,
        radius,
        speed,
        spin: Math.random() * Math.PI,
        spinSpeed: (Math.random() - 0.5) * 1.6,
        wobble: Math.random() * 10,
        wobbleSpeed: 2 + Math.random() * 2
    });
}

function handlePointer(event) {
    if (game.state !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    for (let index = game.targets.length - 1; index >= 0; index -= 1) {
        const target = game.targets[index];
        const wobbleX = Math.sin(target.wobble) * 8;
        const dx = x - (target.x + wobbleX);
        const dy = y - target.y;
        const hitRadius = target.radius * 1.18;
        if (dx * dx + dy * dy <= hitRadius * hitRadius) {
            popTarget(target, index);
            return;
        }
    }
}

function popTarget(target, index) {
    game.targets.splice(index, 1);
    game.combo += 1;
    game.hits += 1;
    const comboBonus = Math.min(40, Math.floor(game.combo / 3) * 5);
    game.score += 20 + comboBonus;
    burst(target.x, target.y, target.type);
    showToast(game.combo >= 5 ? `Combo x${game.combo}!` : 'Great tap!');
}

function burst(x, y, type) {
    const colors = getShapeColors(type);
    for (let index = 0; index < 18; index += 1) {
        const angle = (Math.PI * 2 * index) / 18;
        const speed = 80 + Math.random() * 120;
        game.particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 4 + Math.random() * 5,
            color: colors[index % colors.length],
            life: 0.45 + Math.random() * 0.25
        });
    }
}

function drawGame() {
    drawBackground();
    game.targets.forEach(drawTarget);
    drawParticles();
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, game.height);
    if (progress.selectedBackground === 'ocean') {
        gradient.addColorStop(0, '#7dd3fc');
        gradient.addColorStop(0.56, '#67e8f9');
        gradient.addColorStop(1, '#99f6e4');
    } else if (progress.selectedBackground === 'jungle') {
        gradient.addColorStop(0, '#bbf7d0');
        gradient.addColorStop(0.52, '#86efac');
        gradient.addColorStop(1, '#fef3c7');
    } else {
        gradient.addColorStop(0, '#bae6fd');
        gradient.addColorStop(0.54, '#fecdd3');
        gradient.addColorStop(1, '#fef08a');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.width, game.height);

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#ffffff';
    for (let index = 0; index < 10; index += 1) {
        const x = ((index * 97 + game.elapsed * 10) % (game.width + 140)) - 70;
        const y = 120 + (index % 5) * 92;
        drawCloud(x, y, 34 + (index % 3) * 8);
    }
    ctx.restore();
}

function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.7, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y - size * 0.18, size * 0.55, 0, Math.PI * 2);
    ctx.arc(x + size * 1.15, y, size * 0.62, 0, Math.PI * 2);
    ctx.fill();
}

function drawTarget(target) {
    const x = target.x + Math.sin(target.wobble) * 8;
    const y = target.y;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(target.spin);
    if (target.type === 'lion') drawLion(target.radius);
    if (target.type === 'jellyfish') drawJellyfish(target.radius);
    if (target.type === 'bubble') drawBubble(target.radius);
    if (target.type === 'shell') drawShell(target.radius);
    if (target.type === 'star') drawStar(target.radius);
    ctx.restore();
}

function drawLion(radius) {
    ctx.fillStyle = '#f59e0b';
    for (let index = 0; index < 18; index += 1) {
        const angle = (Math.PI * 2 * index) / 18;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * radius * 0.72, Math.sin(angle) * radius * 0.72);
        ctx.lineTo(Math.cos(angle + 0.12) * radius * 1.12, Math.sin(angle + 0.12) * radius * 1.12);
        ctx.lineTo(Math.cos(angle + 0.24) * radius * 0.72, Math.sin(angle + 0.24) * radius * 0.72);
        ctx.fill();
    }
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2);
    ctx.fill();
    drawFace(radius, '#7c2d12');
}

function drawJellyfish(radius) {
    ctx.fillStyle = '#fb7abe';
    ctx.beginPath();
    ctx.arc(0, -radius * 0.12, radius * 0.78, Math.PI, 0);
    ctx.quadraticCurveTo(radius * 0.8, radius * 0.58, 0, radius * 0.58);
    ctx.quadraticCurveTo(-radius * 0.8, radius * 0.58, -radius * 0.78, -radius * 0.12);
    ctx.fill();
    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let index = -2; index <= 2; index += 1) {
        ctx.beginPath();
        ctx.moveTo(index * radius * 0.24, radius * 0.46);
        ctx.quadraticCurveTo(index * radius * 0.24 + 12, radius * 0.86, index * radius * 0.12, radius * 1.15);
        ctx.stroke();
    }
    drawFace(radius * 0.72, '#831843', -radius * 0.12);
}

function drawBubble(radius) {
    const gradient = ctx.createRadialGradient(-radius * 0.32, -radius * 0.36, radius * 0.1, 0, 0, radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.46, '#a7f3d0');
    gradient.addColorStop(1, '#38bdf8');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.86, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.86)';
    ctx.lineWidth = 5;
    ctx.stroke();
}

function drawShell(radius) {
    ctx.fillStyle = '#f9a8d4';
    ctx.beginPath();
    ctx.moveTo(-radius * 0.8, radius * 0.44);
    ctx.quadraticCurveTo(-radius * 0.6, -radius * 0.9, 0, -radius * 0.92);
    ctx.quadraticCurveTo(radius * 0.6, -radius * 0.9, radius * 0.8, radius * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#be185d';
    ctx.lineWidth = 4;
    for (let index = -2; index <= 2; index += 1) {
        ctx.beginPath();
        ctx.moveTo(0, -radius * 0.82);
        ctx.quadraticCurveTo(index * radius * 0.18, -radius * 0.1, index * radius * 0.36, radius * 0.42);
        ctx.stroke();
    }
}

function drawStar(radius) {
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    for (let index = 0; index < 10; index += 1) {
        const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 10;
        const pointRadius = index % 2 === 0 ? radius : radius * 0.45;
        const x = Math.cos(angle) * pointRadius;
        const y = Math.sin(angle) * pointRadius;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    drawFace(radius * 0.75, '#854d0e');
}

function drawFace(radius, color, yOffset = 0) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(-radius * 0.26, yOffset - radius * 0.08, radius * 0.07, 0, Math.PI * 2);
    ctx.arc(radius * 0.26, yOffset - radius * 0.08, radius * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, yOffset + radius * 0.1, radius * 0.24, 0.12 * Math.PI, 0.88 * Math.PI);
    ctx.stroke();
}

function drawParticles() {
    game.particles.forEach((particle) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, particle.life * 2);
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function getShapeColors(type) {
    const colors = {
        lion: ['#f97316', '#facc15', '#fff7ad'],
        jellyfish: ['#fb7abe', '#c084fc', '#f0abfc'],
        bubble: ['#38bdf8', '#99f6e4', '#ffffff'],
        shell: ['#f9a8d4', '#f472b6', '#fde68a'],
        star: ['#facc15', '#fde047', '#fb923c']
    };
    return colors[type] || colors.bubble;
}

function updateHud() {
    ui.score.textContent = game.score;
    ui.level.textContent = progress.level;
    ui.timer.textContent = Math.ceil(game.timeLeft);
    ui.hearts.textContent = '♥'.repeat(game.hearts) || '0';
    ui.combo.textContent = game.combo >= 3 ? `Combo x${game.combo}` : '';
}

function updateHome() {
    ui.homeLevel.textContent = progress.level;
    ui.homeCoins.textContent = progress.coins;
    ui.homeBest.textContent = progress.bestScore;
    ui.homeXpFill.style.width = `${Math.min(100, (progress.xp / xpNeeded()) * 100)}%`;
}

function renderResults(stars, earnedCoins, earnedXp, unlocks) {
    ui.resultTitle.textContent = stars === 3 ? 'Amazing tapping!' : stars === 2 ? 'Great round!' : 'Nice try!';
    ui.resultStars.textContent = '★'.repeat(stars);
    ui.resultScore.textContent = game.score;
    ui.resultCoins.textContent = `+${earnedCoins}`;
    ui.resultXp.textContent = `+${earnedXp}`;
    ui.resultBest.textContent = progress.bestScore;
    ui.resultXpFill.style.width = `${Math.min(100, (progress.xp / xpNeeded()) * 100)}%`;
    ui.unlockMessage.textContent = unlocks.length ? unlocks.join(' ') : 'Keep playing to unlock more friends.';
}

function renderCollection() {
    ui.shapeCollection.innerHTML = '';
    Object.entries(SHAPE_UNLOCK_LEVELS).forEach(([shape, level]) => {
        const unlocked = progress.unlockedShapes.includes(shape);
        ui.shapeCollection.appendChild(createCollectionItem(SHAPE_ICONS[shape], SHAPE_LABELS[shape], level, unlocked));
    });

    ui.backgroundCollection.innerHTML = '';
    Object.entries(BACKGROUND_UNLOCK_LEVELS).forEach(([background, level]) => {
        const unlocked = progress.unlockedBackgrounds.includes(background);
        const item = createCollectionItem('Scene', BACKGROUND_LABELS[background], level, unlocked);
        if (unlocked) {
            item.addEventListener('click', () => {
                progress.selectedBackground = background;
                saveProgress();
                drawGame();
                showToast(`${BACKGROUND_LABELS[background]} selected`);
            });
        }
        ui.backgroundCollection.appendChild(item);
    });
}

function createCollectionItem(icon, label, level, unlocked) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `collection-item${unlocked ? '' : ' locked'}`;
    item.innerHTML = `<strong class="collection-icon">${icon}</strong><span>${label}</span><small>${unlocked ? 'Unlocked' : `Level ${level}`}</small>`;
    return item;
}

function showToast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
        ui.toast.classList.remove('show');
    }, 800);
}

function resetProgress() {
    const confirmed = window.confirm('Reset Falling Friends progress?');
    if (!confirmed) return;
    progress = createDefaultProgress();
    saveProgress();
    updateHome();
    renderCollection();
    showToast('Progress reset');
}

document.getElementById('play-btn').addEventListener('click', startRound);
document.getElementById('play-again-btn').addEventListener('click', startRound);
document.getElementById('pause-btn').addEventListener('click', pauseRound);
document.getElementById('resume-btn').addEventListener('click', resumeRound);
document.getElementById('quit-btn').addEventListener('click', finishRound);
document.getElementById('collection-btn').addEventListener('click', () => {
    renderCollection();
    showScreen('collection');
});
document.getElementById('results-collection-btn').addEventListener('click', () => {
    renderCollection();
    showScreen('collection');
});
document.getElementById('close-collection-btn').addEventListener('click', () => {
    showScreen(game.state === 'result' ? 'result' : 'start');
});
document.getElementById('reset-progress-btn').addEventListener('click', resetProgress);
canvas.addEventListener('pointerdown', handlePointer);
window.addEventListener('resize', () => {
    resizeCanvas();
    drawGame();
});

resizeCanvas();
updateHome();
renderCollection();
updateHud();
drawGame();
