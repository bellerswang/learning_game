(() => {
    'use strict';

    const STORAGE_KEY = 'memory-quest-v2';
    const MISMATCH_DELAY_MS = 850;
    const MATCH_DELAY_MS = 450;
    const PREVIEW_DELAY_MS = 1700;
    const DIFFICULTIES = [
        { id: 'easy', name: 'Easy', pairs: 4, note: 'A little warm-up' },
        { id: 'standard', name: 'Standard', pairs: 6, note: 'A happy challenge' },
        { id: 'challenge', name: 'Challenge', pairs: 8, note: 'Think carefully' },
        { id: 'master', name: 'Master', pairs: 10, note: 'For memory experts' }
    ];
    const makeItems = (prefix, entries) => entries.map(([id, image, label]) => ({
        id: `${prefix}-${id}`, image, label
    }));
    const THEMES = [
        { id: 'animals', name: 'Animal Forest', shortName: 'Animals', icon: '🦊', items: makeItems('animals', [
            ['cat', '🐱', 'Cat'], ['dog', '🐶', 'Dog'], ['fox', '🦊', 'Fox'], ['panda', '🐼', 'Panda'],
            ['penguin', '🐧', 'Penguin'], ['frog', '🐸', 'Frog'], ['rabbit', '🐰', 'Rabbit'], ['bear', '🐻', 'Bear'],
            ['lion', '🦁', 'Lion'], ['tiger', '🐯', 'Tiger'], ['cow', '🐮', 'Cow'], ['pig', '🐷', 'Pig'],
            ['koala', '🐨', 'Koala'], ['butterfly', '🦋', 'Butterfly'], ['turtle', '🐢', 'Turtle'], ['octopus', '🐙', 'Octopus'],
            ['crab', '🦀', 'Crab'], ['owl', '🦉', 'Owl'], ['bee', '🐝', 'Bee'], ['dolphin', '🐬', 'Dolphin'],
            ['unicorn', '🦄', 'Unicorn'], ['ladybird', '🐞', 'Ladybird'], ['dinosaur', '🦕', 'Dinosaur'], ['chicken', '🐔', 'Chicken']
        ]) },
        { id: 'food', name: 'Tasty Town', shortName: 'Food', icon: '🍓', items: makeItems('food', [
            ['apple', '🍎', 'Apple'], ['strawberry', '🍓', 'Strawberry'], ['banana', '🍌', 'Banana'], ['watermelon', '🍉', 'Watermelon'],
            ['pineapple', '🍍', 'Pineapple'], ['grapes', '🍇', 'Grapes'], ['cherries', '🍒', 'Cherries'], ['carrot', '🥕', 'Carrot'],
            ['corn', '🌽', 'Corn'], ['mushroom', '🍄', 'Mushroom'], ['pretzel', '🥨', 'Pretzel'], ['croissant', '🥐', 'Croissant'],
            ['cheese', '🧀', 'Cheese'], ['pizza', '🍕', 'Pizza'], ['burger', '🍔', 'Burger'], ['doughnut', '🍩', 'Doughnut'],
            ['cookie', '🍪', 'Cookie'], ['cupcake', '🧁', 'Cupcake'], ['icecream', '🍦', 'Ice cream'], ['lemon', '🍋', 'Lemon'],
            ['avocado', '🥑', 'Avocado'], ['kiwi', '🥝', 'Kiwi'], ['peach', '🍑', 'Peach'], ['bread', '🍞', 'Bread']
        ]) },
        { id: 'space', name: 'Space Trip', shortName: 'Space', icon: '🚀', items: makeItems('space', [
            ['rocket', '🚀', 'Rocket'], ['planet', '🪐', 'Planet'], ['moon', '🌙', 'Moon'], ['star', '⭐', 'Star'],
            ['comet', '☄️', 'Comet'], ['alien', '👽', 'Alien'], ['ufo', '🛸', 'UFO'], ['earth', '🌍', 'Earth'],
            ['telescope', '🔭', 'Telescope'], ['satellite', '🛰️', 'Satellite'], ['galaxy', '🌌', 'Galaxy'], ['shootingstar', '🌠', 'Shooting star'],
            ['astronaut', '🧑‍🚀', 'Astronaut'], ['sun', '🌞', 'Sun'], ['sparkles', '🌟', 'Sparkles'], ['compass', '🧭', 'Compass'],
            ['redplanet', '🔴', 'Red planet'], ['purpleplanet', '🟣', 'Purple planet'], ['newmoon', '🌑', 'New moon'], ['fullmoon', '🌕', 'Full moon'],
            ['whirl', '💫', 'Whirl'], ['spacesuit', '🥽', 'Space goggles'], ['robot', '🤖', 'Robot'], ['beacon', '📡', 'Beacon']
        ]) },
        { id: 'nature', name: 'Nature Trail', shortName: 'Nature', icon: '🌻', items: makeItems('nature', [
            ['rainbow', '🌈', 'Rainbow'], ['blossom', '🌸', 'Blossom'], ['sunflower', '🌻', 'Sunflower'], ['daisy', '🌼', 'Daisy'],
            ['rose', '🌹', 'Rose'], ['tulip', '🌷', 'Tulip'], ['tree', '🌲', 'Tree'], ['palm', '🌴', 'Palm tree'],
            ['leaf', '🍁', 'Leaf'], ['clover', '🍀', 'Clover'], ['cactus', '🌵', 'Cactus'], ['plant', '🪴', 'Plant'],
            ['wave', '🌊', 'Wave'], ['mountain', '⛰️', 'Mountain'], ['volcano', '🌋', 'Volcano'], ['shell', '🐚', 'Shell'],
            ['wind', '🍃', 'Wind'], ['herb', '🌿', 'Herb'], ['wheat', '🌾', 'Wheat'], ['seedling', '🌱', 'Seedling'],
            ['rock', '🪨', 'Rock'], ['snow', '❄️', 'Snowflake'], ['fire', '🔥', 'Fire'], ['cloud', '☁️', 'Cloud']
        ]) }
    ];
    THEMES.push({ id: 'mystery', name: 'Mystery Mix', shortName: 'Mystery', icon: '🎁', items: THEMES.flatMap(theme => theme.items) });

    const $ = (id) => document.getElementById(id);
    const elements = {
        setup: $('setup-screen'), play: $('play-screen'), difficultyList: $('difficulty-list'), themeList: $('theme-list'),
        summary: $('selection-summary'), collection: $('collection-list'), grid: $('card-grid'), message: $('game-message'),
        pairs: $('pairs-counter'), moves: $('moves-counter'), progress: $('progress-track'), progressFill: $('progress-fill'),
        worldIcon: $('world-icon'), worldTitle: $('world-title'), mission: $('mission-text'), round: $('round-label'),
        eventOverlay: $('event-overlay'), eventArt: $('event-art'), eventTitle: $('event-title'), eventDescription: $('event-description'),
        eventActions: $('event-actions'), resultOverlay: $('result-overlay'), resultArt: $('result-art'),
        resultEyebrow: $('result-eyebrow'), resultTitle: $('result-title'), resultStars: $('result-stars'),
        resultDetails: $('result-details'), rewardNote: $('reward-note'), next: $('next-button')
    };
    const saved = loadSaved();
    let selection = { difficultyId: saved.difficultyId, themeId: saved.themeId };
    let progress = saved.progress;
    let state = null;
    const timers = new Set();

    function loadSaved() {
        let data = {};
        try { data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch (_) { /* Storage can be unavailable. */ }
        const rounds = {}, stickers = {};
        for (const theme of THEMES) {
            const round = Number(data.progress?.rounds?.[theme.id]);
            const sticker = Number(data.progress?.stickers?.[theme.id]);
            rounds[theme.id] = Number.isInteger(round) && round >= 0 && round < 3 ? round : 0;
            stickers[theme.id] = Number.isInteger(sticker) && sticker >= 0 ? sticker : 0;
        }
        return {
            difficultyId: DIFFICULTIES.some(d => d.id === data.difficultyId) ? data.difficultyId : 'standard',
            themeId: THEMES.some(t => t.id === data.themeId) ? data.themeId : 'animals',
            progress: { rounds, stickers }
        };
    }

    function save() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...selection, progress })); } catch (_) { /* Playing still works. */ }
    }

    function shuffle(items) {
        const result = [...items];
        for (let i = result.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    function schedule(callback, delay) {
        const timer = window.setTimeout(() => { timers.delete(timer); callback(); }, delay);
        timers.add(timer);
    }

    function clearTimers() {
        for (const timer of timers) window.clearTimeout(timer);
        timers.clear();
    }

    function selectedDifficulty() { return DIFFICULTIES.find(d => d.id === selection.difficultyId); }
    function selectedTheme() { return THEMES.find(t => t.id === selection.themeId); }

    function renderChoices() {
        elements.difficultyList.replaceChildren(...DIFFICULTIES.map(difficulty => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'choice-card';
            button.dataset.difficulty = difficulty.id;
            button.setAttribute('aria-pressed', String(selection.difficultyId === difficulty.id));
            button.innerHTML = `<strong>${difficulty.name}</strong><small>${difficulty.pairs} pairs · ${difficulty.note}</small>`;
            return button;
        }));
        elements.themeList.replaceChildren(...THEMES.map(theme => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'theme-choice';
            button.dataset.theme = theme.id;
            button.setAttribute('aria-pressed', String(selection.themeId === theme.id));
            button.innerHTML = `<span class="theme-emoji" aria-hidden="true">${theme.icon}</span><span>${theme.shortName}</span>`;
            return button;
        }));
        const theme = selectedTheme();
        elements.summary.textContent = `${selectedDifficulty().pairs} pairs · ${theme.shortName} · Round ${progress.rounds[theme.id] + 1} of 3`;
        elements.collection.replaceChildren(...THEMES.map(item => {
            const div = document.createElement('div');
            div.className = 'shelf-item';
            div.innerHTML = `<strong aria-hidden="true">${item.icon}</strong><b>${item.shortName}</b><span>${progress.stickers[item.id]} stickers · ${progress.rounds[item.id]}/3</span>`;
            return div;
        }));
    }

    function createDeck(pairCount, theme) {
        return shuffle(shuffle(theme.items).slice(0, pairCount).flatMap(item => [0, 1].map(copy => ({
            ...item, matchId: item.id, cardId: `${item.id}-${copy}`, faceUp: false, matched: false
        }))));
    }

    function renderCard(card, index) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'memory-card';
        button.dataset.cardId = card.cardId;
        button.setAttribute('aria-label', `Card ${index + 1}, face down`);
        button.setAttribute('aria-pressed', 'false');
        button.innerHTML = `<span class="card-inner"><span class="card-face card-back" aria-hidden="true">✦</span><span class="card-face card-front" aria-hidden="true"><span class="card-picture">${card.image}</span><span class="card-label">${card.label}</span></span></span>`;
        return button;
    }

    function updateCard(card) {
        const button = elements.grid.querySelector(`[data-card-id="${card.cardId}"]`);
        if (!button) return;
        const preview = state.previewIds.has(card.cardId);
        button.classList.toggle('is-face-up', card.faceUp || card.matched);
        button.classList.toggle('is-peeking', preview);
        button.classList.toggle('is-matched', card.matched);
        button.classList.toggle('is-golden', state.goldenCardId === card.cardId && !card.matched);
        button.disabled = card.matched;
        button.setAttribute('aria-pressed', String(card.faceUp || card.matched || preview));
        button.setAttribute('aria-label', card.matched ? `${card.label}, matched` :
            card.faceUp || preview ? `${card.label}, face up` : 'Hidden card');
    }

    function updateProgress() {
        elements.pairs.textContent = `${state.matchedPairs} / ${state.pairCount} pairs`;
        elements.moves.textContent = `${state.moves} ${state.moves === 1 ? 'move' : 'moves'}`;
        elements.progress.setAttribute('aria-valuemax', String(state.pairCount));
        elements.progress.setAttribute('aria-valuenow', String(state.matchedPairs));
        elements.progressFill.style.width = `${state.matchedPairs / state.pairCount * 100}%`;
    }

    function startRound() {
        clearTimers();
        elements.eventOverlay.hidden = true;
        elements.resultOverlay.hidden = true;
        const difficulty = selectedDifficulty();
        const theme = selectedTheme();
        const eventChance = Math.random() < 0.75;
        state = {
            deck: createDeck(difficulty.pairs, theme), pairCount: difficulty.pairs, matchedPairs: 0, moves: 0,
            firstCardId: null, locked: false, finished: false, previewIds: new Set(),
            eventType: eventChance ? shuffle(['gift', 'rainbow', 'golden'])[0] : null,
            eventThreshold: Math.max(1, Math.min(difficulty.pairs - 1, Math.ceil(difficulty.pairs * (0.25 + Math.random() * 0.35)))),
            eventDone: false, bonusSparkles: 0, goldenCardId: null, goldenMatchId: null,
            roundNumber: progress.rounds[theme.id] + 1
        };
        elements.grid.replaceChildren(...state.deck.map(renderCard));
        elements.grid.setAttribute('aria-label', `${state.pairCount * 2} memory cards`);
        elements.worldIcon.textContent = theme.icon;
        elements.worldTitle.textContent = theme.name;
        elements.mission.textContent = `Find ${difficulty.pairs} matching pairs`;
        elements.round.textContent = `Round ${state.roundNumber} of 3`;
        elements.message.textContent = 'Tap two cards to find a pair.';
        updateProgress();
        elements.setup.hidden = true;
        elements.play.hidden = false;
        window.scrollTo(0, 0);
    }

    function returnToChoices() {
        clearTimers();
        state = null;
        elements.eventOverlay.hidden = true;
        elements.resultOverlay.hidden = true;
        elements.play.hidden = true;
        elements.setup.hidden = false;
        renderChoices();
        window.scrollTo(0, 0);
    }

    function previewCards(cards, description) {
        state.previewIds = new Set(cards.map(card => card.cardId));
        for (const card of cards) updateCard(card);
        elements.message.textContent = description;
        const activeState = state;
        schedule(() => {
            if (state !== activeState) return;
            state.previewIds.clear();
            for (const card of cards) updateCard(card);
            state.locked = false;
            elements.message.textContent = 'Remember what you saw!';
        }, PREVIEW_DELAY_MS);
    }

    function showEvent(type) {
        state.locked = true;
        elements.eventActions.replaceChildren();
        const addAction = (label, action, secondary = false) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = secondary ? 'secondary-button' : 'primary-button';
            button.textContent = label;
            button.addEventListener('click', action, { once: true });
            elements.eventActions.appendChild(button);
            return button;
        };
        const close = () => { elements.eventOverlay.hidden = true; };
        if (type === 'gift') {
            elements.eventArt.textContent = '🦊';
            elements.eventTitle.textContent = 'A fox brought two gifts!';
            elements.eventDescription.textContent = 'Pick one box. What will be inside?';
            const rewards = shuffle(['peek', 'sparkle']);
            ['🎁 The red box', '🎁 The blue box'].forEach((label, index) => addAction(label, () => {
                close();
                if (rewards[index] === 'peek') {
                    const pair = shuffle(state.deck.filter(card => !card.matched).map(card => card.matchId))[0];
                    previewCards(state.deck.filter(card => card.matchId === pair), 'A little peek at one hidden pair!');
                } else {
                    state.bonusSparkles += 1;
                    state.locked = false;
                    elements.message.textContent = 'A bonus sparkle for your adventure! ✨';
                }
            }, index === 1));
        } else if (type === 'rainbow') {
            elements.eventArt.textContent = '🌈';
            elements.eventTitle.textContent = 'Rainbow flash!';
            elements.eventDescription.textContent = 'The remaining cards will show themselves for a moment. Look closely!';
            addAction('Ready to peek', () => { close(); previewCards(state.deck.filter(card => !card.matched), 'Look closely at the rainbow peek!'); });
        } else {
            elements.eventArt.textContent = '🌟';
            elements.eventTitle.textContent = 'A secret star has landed!';
            elements.eventDescription.textContent = 'Match the card with the gold star to collect an extra sparkle.';
            addAction('Find the star', () => {
                close();
                const card = shuffle(state.deck.filter(item => !item.matched))[0];
                state.goldenCardId = card.cardId;
                state.goldenMatchId = card.matchId;
                updateCard(card);
                state.locked = false;
                elements.message.textContent = 'Find the gold star pair!';
            });
        }
        elements.eventOverlay.hidden = false;
        elements.eventActions.querySelector('button').focus();
    }

    function maybeEvent() {
        if (!state.eventDone && state.eventType && state.matchedPairs === state.eventThreshold) {
            state.eventDone = true;
            showEvent(state.eventType);
        } else {
            state.locked = false;
            elements.message.textContent = 'Keep going — find another pair!';
        }
    }

    function finishGame() {
        state.finished = true;
        const themeId = selection.themeId;
        const isSticker = state.roundNumber === 3;
        progress.rounds[themeId] = isSticker ? 0 : state.roundNumber;
        if (isSticker) progress.stickers[themeId] += 1;
        save();

        const stars = state.moves <= state.pairCount + 2 ? 3 : state.moves <= state.pairCount * 2 ? 2 : 1;
        elements.resultArt.textContent = isSticker ? '🏅' : selectedTheme().icon;
        elements.resultEyebrow.textContent = isSticker ? 'Sticker collected!' : `Round ${state.roundNumber} complete`;
        elements.resultTitle.textContent = isSticker ? 'A new sticker for your shelf!' : 'Brilliant remembering!';
        elements.resultStars.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        elements.resultStars.setAttribute('aria-label', `${stars} out of 3 stars`);
        elements.resultDetails.textContent = `You found ${state.pairCount} pairs in ${state.moves} moves.`;
        elements.rewardNote.textContent = isSticker ? `${selectedTheme().shortName} sticker ×${progress.stickers[themeId]}` :
            state.bonusSparkles ? `${state.bonusSparkles} bonus sparkle collected ✨` : `${3 - state.roundNumber} rounds until your next sticker`;
        elements.next.textContent = isSticker ? 'Start a new adventure →' : 'Next round →';
        elements.resultOverlay.hidden = false;
        elements.next.focus();
    }

    function chooseCard(cardId) {
        if (!state || state.locked || state.finished) return;
        const card = state.deck.find(item => item.cardId === cardId);
        if (!card || card.faceUp || card.matched) return;
        card.faceUp = true;
        updateCard(card);
        if (!state.firstCardId) {
            state.firstCardId = cardId;
            elements.message.textContent = 'Now find its match.';
            return;
        }
        const first = state.deck.find(item => item.cardId === state.firstCardId);
        state.firstCardId = null;
        state.moves += 1;
        state.locked = true;
        updateProgress();
        const activeState = state;
        if (first.matchId === card.matchId) {
            elements.message.textContent = 'A match! ✨';
            schedule(() => {
                if (state !== activeState) return;
                first.matched = true;
                card.matched = true;
                updateCard(first);
                updateCard(card);
                state.matchedPairs += 1;
                if (state.goldenMatchId === card.matchId) {
                    state.bonusSparkles += 1;
                    state.goldenMatchId = null;
                    state.goldenCardId = null;
                }
                updateProgress();
                if (state.matchedPairs === state.pairCount) finishGame();
                else maybeEvent();
            }, MATCH_DELAY_MS);
        } else {
            elements.message.textContent = 'Not a pair yet. Remember these pictures!';
            schedule(() => {
                if (state !== activeState) return;
                first.faceUp = false;
                card.faceUp = false;
                updateCard(first);
                updateCard(card);
                state.locked = false;
                elements.message.textContent = 'Try another pair.';
            }, MISMATCH_DELAY_MS);
        }
    }

    elements.difficultyList.addEventListener('click', event => {
        const button = event.target.closest('[data-difficulty]');
        if (!button) return;
        selection.difficultyId = button.dataset.difficulty;
        save();
        renderChoices();
    });
    elements.themeList.addEventListener('click', event => {
        const button = event.target.closest('[data-theme]');
        if (!button) return;
        selection.themeId = button.dataset.theme;
        save();
        renderChoices();
    });
    elements.grid.addEventListener('click', event => {
        const button = event.target.closest('.memory-card');
        if (button && elements.grid.contains(button)) chooseCard(button.dataset.cardId);
    });
    $('start-button').addEventListener('click', () => startRound());
    $('restart-button').addEventListener('click', () => startRound());
    $('change-button').addEventListener('click', returnToChoices);
    $('choices-button').addEventListener('click', returnToChoices);
    elements.next.addEventListener('click', () => startRound());

    renderChoices();
})();
