// State Management
const state = {
    size: 'small',
    speed: 'medium',
    types: ['circle'],
    color: 'red'
};

// Configuration Maps
const config = {
    size: {
        small: { particleCount: 30, spread: 2, decay: 0.03 },
        medium: { particleCount: 60, spread: 4, decay: 0.02 },
        large: { particleCount: 100, spread: 6, decay: 0.015 }
    },
    speed: {
        slow: { gravity: 0.05, velocity: 3 },
        medium: { gravity: 0.1, velocity: 5 },
        fast: { gravity: 0.2, velocity: 8 }
    },
    colors: {
        red: ['#ff4d4d', '#ff9999', '#ff0000'],
        blue: ['#4d4dff', '#9999ff', '#0000ff'],
        green: ['#4dff4d', '#99ff99', '#00ff00'],
        gold: ['#ffd700', '#ffeb3b', '#ffc107'],
        rainbow: ['#ff0000', '#ffa500', '#ffff00', '#008000', '#0000ff', '#4b0082', '#ee82ee']
    }
};

// DOM Elements
const app = document.getElementById('app');
const settingsStage = document.getElementById('settings-stage');
const animationStage = document.getElementById('animation-stage');
const canvas = document.getElementById('firework-canvas');
const ctx = canvas.getContext('2d');

// UI Initialization
function initUI() {
    // Option Buttons
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const group = btn.closest('.options').id.split('-')[0]; // size, speed, type, color
            const value = btn.dataset.value;

            if (group === 'type') {
                // Multi-select for types
                if (value === 'random') {
                    // If Surprise picked, clear others and select only random
                    state.types = ['random'];
                    btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                } else {
                    // If specific shape picked
                    // If 'random' was previously selected, clear it
                    if (state.types.includes('random')) {
                        state.types = [];
                        btn.parentElement.querySelector('[data-value="random"]').classList.remove('selected');
                    }

                    // Toggle selection
                    if (state.types.includes(value)) {
                        // Prevent deselecting if it's the last one
                        if (state.types.length > 1) {
                            state.types = state.types.filter(t => t !== value);
                            btn.classList.remove('selected');
                        }
                    } else {
                        state.types.push(value);
                        btn.classList.add('selected');
                    }
                }
            } else {
                // Single-select for others
                state[group] = value;
                btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            }

            playSound('click');
        });
    });

    // Launch Button
    document.getElementById('launch-btn').addEventListener('click', () => {
        switchStage('animation');
        startAnimation();
        playSound('launch');
    });

    // Back Button
    document.getElementById('back-btn').addEventListener('click', () => {
        switchStage('settings');
        stopAnimation();
    });

    // Fire Button (Manual Trigger)
    document.getElementById('fire-btn').addEventListener('click', () => {
        createFirework();
    });
}

function switchStage(stageName) {
    if (stageName === 'animation') {
        settingsStage.classList.add('hidden');
        animationStage.classList.remove('hidden');
        resizeCanvas();
    } else {
        settingsStage.classList.remove('hidden');
        animationStage.classList.add('hidden');
    }
}

function playSound(type) {
    // Placeholder for sound effects
    // console.log(`Playing sound: ${type}`);
}

// Animation System
let particles = [];
let animationId;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);

class Particle {
    constructor(x, y, color, vx, vy, gravity, decay) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.alpha = 1;
        this.vx = vx;
        this.vy = vy;
        this.gravity = gravity;
        this.decay = decay;
    }

    update() {
        this.vx *= 0.95; // Air resistance
        this.vy *= 0.95;
        this.vy += this.gravity;

        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function createFirework() {
    const sizeConfig = config.size[state.size];
    const speedConfig = config.speed[state.speed];
    const colorPalette = config.colors[state.color];

    const x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
    const y = Math.random() * canvas.height * 0.5 + canvas.height * 0.1;

    let type;
    // Pick a random type from the selected types
    const selectedType = state.types[Math.floor(Math.random() * state.types.length)];

    if (selectedType === 'random') {
        const allTypes = ['circle', 'star', 'heart', 'ring', 'flower'];
        type = allTypes[Math.floor(Math.random() * allTypes.length)];
    } else {
        type = selectedType;
    }

    const baseSpeed = speedConfig.velocity * (sizeConfig.spread / 2);

    for (let i = 0; i < sizeConfig.particleCount; i++) {
        const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        let vx, vy;

        if (type === 'heart') {
            const angle = (i / sizeConfig.particleCount) * Math.PI * 2;
            // Heart formula
            const r = baseSpeed * 0.15; // Scale down slightly
            vx = r * 16 * Math.pow(Math.sin(angle), 3);
            vy = -r * (13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
        } else if (type === 'ring') {
            const angle = (i / sizeConfig.particleCount) * Math.PI * 2;
            vx = Math.cos(angle) * baseSpeed;
            vy = Math.sin(angle) * baseSpeed;
        } else if (type === 'flower') {
            const angle = (i / sizeConfig.particleCount) * Math.PI * 2;
            // Flower petal effect: radius varies with angle
            const r = baseSpeed * (0.5 + 0.5 * Math.sin(angle * 5));
            vx = Math.cos(angle) * r * 2;
            vy = Math.sin(angle) * r * 2;
        } else if (type === 'star') {
            const angle = (i / sizeConfig.particleCount) * Math.PI * 2;
            const r = baseSpeed * (1 + 0.5 * Math.sin(angle * 5)); // 5 points
            vx = Math.cos(angle) * r;
            vy = Math.sin(angle) * r;
        } else {
            // Default Circle/Explosion
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * baseSpeed;
            vx = Math.cos(angle) * speed;
            vy = Math.sin(angle) * speed;
        }

        // Add some randomness to all
        vx += (Math.random() - 0.5) * 0.5;
        vy += (Math.random() - 0.5) * 0.5;

        particles.push(new Particle(x, y, color, vx, vy, speedConfig.gravity, sizeConfig.decay));
    }
}

function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Trail effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle, index) => {
        particle.update();
        particle.draw(ctx);

        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        }
    });

    // Auto-fire logic (randomly add fireworks if none are active or just periodically)
    if (Math.random() < 0.05) { // 5% chance per frame
        createFirework();
    }

    animationId = requestAnimationFrame(animate);
}

function startAnimation() {
    particles = [];
    animate();
}

function stopAnimation() {
    cancelAnimationFrame(animationId);
}

// Initialize
initUI();
