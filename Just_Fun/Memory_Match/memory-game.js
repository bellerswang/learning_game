(() => {
    'use strict';

    const PAIR_COUNT = 11;
    const MISMATCH_DELAY_MS = 850;
    const MATCH_DELAY_MS = 520;

    // Each item represents a match pair; presentation can later change without changing match rules.
    const IMAGE_SET = [
        { id: 'cat', matchId: 'cat', label: 'Cat', image: '🐱' },
        { id: 'dog', matchId: 'dog', label: 'Dog', image: '🐶' },
        { id: 'fox', matchId: 'fox', label: 'Fox', image: '🦊' },
        { id: 'panda', matchId: 'panda', label: 'Panda', image: '🐼' },
        { id: 'apple', matchId: 'apple', label: 'Apple', image: '🍎' },
        { id: 'strawberry', matchId: 'strawberry', label: 'Strawberry', image: '🍓' },
        { id: 'star', matchId: 'star', label: 'Star', image: '⭐' },
        { id: 'rocket', matchId: 'rocket', label: 'Rocket', image: '🚀' },
        { id: 'teddy', matchId: 'teddy', label: 'Teddy', image: '🧸' },
        { id: 'rainbow', matchId: 'rainbow', label: 'Rainbow', image: '🌈' },
        { id: 'car', matchId: 'car', label: 'Car', image: '🚗' },
        { id: 'sun', matchId: 'sun', label: 'Sun', image: '☀️' },
        { id: 'penguin', matchId: 'penguin', label: 'Penguin', image: '🐧' },
        { id: 'butterfly', matchId: 'butterfly', label: 'Butterfly', image: '🦋' },
        { id: 'banana', matchId: 'banana', label: 'Banana', image: '🍌' },
        { id: 'dinosaur', matchId: 'dinosaur', label: 'Dinosaur', image: '🦕' }
    ];

    const grid = document.getElementById('card-grid');
    const movesCounter = document.getElementById('moves-counter');
    const pairsCounter = document.getElementById('pairs-counter');
    const message = document.getElementById('game-message');
    const completionPanel = document.getElementById('completion-panel');
    const finalMoves = document.getElementById('final-moves');
    let state;

    function shuffle(items) {
        const result = [...items];
        for (let i = result.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    function createDeck(pairCount = PAIR_COUNT, imageSet = IMAGE_SET) {
        const chosenImages = shuffle(imageSet).slice(0, pairCount);
        const cards = chosenImages.flatMap((pair, index) => [0, 1].map((copy) => ({
            ...pair,
            cardId: `${pair.id}-${copy}-${index}`,
            faceUp: false,
            matched: false
        })));
        return shuffle(cards);
    }

    function renderCard(card, index) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'memory-card';
        button.dataset.cardId = card.cardId;
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-label', `Card ${index + 1}, face down`);
        button.innerHTML = `
            <span class="card-inner">
                <span class="card-face card-back" aria-hidden="true">?</span>
                <span class="card-face card-front" aria-hidden="true">
                    <span class="card-picture">${card.image}</span>
                    <span class="card-label">${card.label}</span>
                </span>
            </span>`;
        return button;
    }

    function updateCard(card) {
        const button = grid.querySelector(`[data-card-id="${card.cardId}"]`);
        if (!button) return;
        button.classList.toggle('is-face-up', card.faceUp || card.matched);
        button.classList.toggle('is-matched', card.matched);
        button.disabled = card.matched;
        button.setAttribute('aria-pressed', String(card.faceUp || card.matched));
        button.setAttribute('aria-label', card.matched
            ? `${card.label}, matched`
            : card.faceUp ? `${card.label}, face up` : 'Hidden card');
    }

    function updateCounters() {
        movesCounter.innerHTML = `Moves <strong>${state.moves}</strong>`;
        pairsCounter.innerHTML = `Pairs <strong>${state.matchedPairs} / ${state.pairCount}</strong>`;
    }

    function startGame(pairCount = PAIR_COUNT, imageSet = IMAGE_SET) {
        if (state?.timeoutId) window.clearTimeout(state.timeoutId);
        state = {
            deck: createDeck(pairCount, imageSet),
            pairCount,
            firstCardId: null,
            secondCardId: null,
            matchedPairs: 0,
            moves: 0,
            locked: false,
            finished: false,
            timeoutId: null
        };
        grid.replaceChildren(...state.deck.map(renderCard));
        grid.setAttribute('aria-label', `${state.pairCount * 2} memory cards`);
        completionPanel.hidden = true;
        message.textContent = 'Find the matching pictures!';
        updateCounters();
    }

    function chooseCard(cardId) {
        if (state.locked || state.finished) return;
        const card = state.deck.find((item) => item.cardId === cardId);
        if (!card || card.matched || card.faceUp) return;

        card.faceUp = true;
        updateCard(card);
        message.textContent = 'Look carefully…';

        if (!state.firstCardId) {
            state.firstCardId = cardId;
            return;
        }

        state.secondCardId = cardId;
        state.moves += 1;
        state.locked = true;
        updateCounters();

        const firstCard = state.deck.find((item) => item.cardId === state.firstCardId);
        const secondCard = card;
        const activeState = state;
        if (firstCard.matchId === secondCard.matchId) {
            message.textContent = 'A match! Lovely spotting!';
            state.timeoutId = window.setTimeout(() => {
                if (state !== activeState) return;
                firstCard.matched = true;
                secondCard.matched = true;
                updateCard(firstCard);
                updateCard(secondCard);
                state.matchedPairs += 1;
                clearTurn();
                updateCounters();
                if (state.matchedPairs === state.pairCount) finishGame();
                else message.textContent = 'Keep going — find another pair!';
            }, MATCH_DELAY_MS);
        } else {
            message.textContent = 'Not a pair this time. Try again!';
            state.timeoutId = window.setTimeout(() => {
                if (state !== activeState) return;
                firstCard.faceUp = false;
                secondCard.faceUp = false;
                updateCard(firstCard);
                updateCard(secondCard);
                clearTurn();
                message.textContent = 'Find the matching pictures!';
            }, MISMATCH_DELAY_MS);
        }
    }

    function clearTurn() {
        state.firstCardId = null;
        state.secondCardId = null;
        state.locked = false;
        state.timeoutId = null;
    }

    function finishGame() {
        state.finished = true;
        message.textContent = 'You found them all!';
        finalMoves.textContent = String(state.moves);
        completionPanel.hidden = false;
        document.getElementById('play-again-button').focus();
    }

    grid.addEventListener('click', (event) => {
        const cardButton = event.target.closest('.memory-card');
        if (cardButton && grid.contains(cardButton)) chooseCard(cardButton.dataset.cardId);
    });
    document.getElementById('restart-button').addEventListener('click', startGame);
    document.getElementById('play-again-button').addEventListener('click', startGame);

    startGame();
})();
