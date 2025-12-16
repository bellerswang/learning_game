/**
 * May's Sentence Lab - Engine
 * ============================
 * Magnetic Poetry style drag-and-drop sentence builder
 * For UK Key Stage 1/2 (ages 6-10)
 */

// ============================================
// DATA STRUCTURES
// ============================================

class WordItem {
    constructor(id, text, type, isCapitalized = false) {
        this.id = id;
        this.text = text;
        this.type = type; // article, noun, verb, adjective, connective, punctuation
        this.isCapitalized = isCapitalized;
    }
}

// ============================================
// GAME STATE
// ============================================

const gameState = {
    currentLevel: 1,
    score: 0,
    mode: 'strict', // 'strict' or 'silly'
    currentLevelData: [],
    correctAnswer: [],
    isDragging: false,
    draggedElement: null,
    dragOffsetX: 0,
    dragOffsetY: 0
};

// ============================================
// WORD BANK - Loaded from JSON
// ============================================

let wordBank = [];
let levelData = {};

// Sentence templates for each level
const sentenceTemplates = {
    1: [
        // Simple: Article + Noun + Verb + Punctuation
        { structure: ['article', 'noun', 'verb', 'punctuation'], levelFilter: 1 }
    ],
    2: [
        // Add adjective: Article + Adjective + Noun + Verb + Punctuation
        { structure: ['article', 'adjective', 'noun', 'verb', 'punctuation'], levelFilter: 2 }
    ],
    3: [
        // Adverb: Article + Noun + Verb + Adverb + Punctuation
        { structure: ['article', 'adjective', 'noun', 'verb', 'adverb', 'punctuation'], levelFilter: 3 }
    ],
    4: [
        // Connective: Article + Noun + Verb + Connective + Verb + Punctuation
        { structure: ['article', 'adjective', 'noun', 'verb', 'connective', 'verb', 'punctuation'], levelFilter: 4 }
    ],
    5: [
        // Complex with preposition: Article + Adjective + Noun + Verb + Preposition + Article + Noun + Punctuation
        { structure: ['article', 'adjective', 'noun', 'verb', 'preposition', 'article', 'noun', 'punctuation'], levelFilter: 5 }
    ]
};

// Load word bank from JSON
async function loadWordBank() {
    try {
        const response = await fetch('word_bank_v2.json');
        if (!response.ok) throw new Error('Failed to load word bank');
        wordBank = await response.json();
        console.log(`✅ Word bank loaded: ${wordBank.length} words`);
        generateAllLevels();
        return true;
    } catch (error) {
        console.error('Error loading word bank:', error);
        // Fallback to hardcoded data
        useFallbackData();
        return false;
    }
}

// Generate level data from word bank
function generateAllLevels() {
    for (let level = 1; level <= 5; level++) {
        levelData[level] = generateLevel(level);
    }
}

// Generate a single level's sentence
function generateLevel(level) {
    const template = sentenceTemplates[level][0];
    const words = [];
    let wordId = 1;

    for (const wordType of template.structure) {
        const word = pickRandomWord(wordType, level);
        if (word) {
            const isCapitalized = wordId === 1 || word.isCapitalized === true;
            words.push(new WordItem(
                wordId,
                isCapitalized ? capitalizeFirst(word.text) : word.text,
                word.type,
                isCapitalized
            ));
            wordId++;
        }
    }

    return {
        words: words,
        correctOrder: words.map((_, idx) => idx + 1),
        hint: words.map(w => w.text).join(' ')
    };
}

// Pick a random word of a specific type
function pickRandomWord(type, maxLevel) {
    const candidates = wordBank.filter(w =>
        w.type === type &&
        w.level <= maxLevel
    );

    if (candidates.length === 0) {
        // Fallback: try without level filter
        const fallbackCandidates = wordBank.filter(w => w.type === type);
        if (fallbackCandidates.length === 0) return null;
        return fallbackCandidates[Math.floor(Math.random() * fallbackCandidates.length)];
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
}

// Capitalize first letter
function capitalizeFirst(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Fallback data if JSON fails to load
function useFallbackData() {
    console.log('Using fallback data');
    levelData = {
        1: {
            words: [
                new WordItem(1, "The", "article", true),
                new WordItem(2, "cat", "noun", false),
                new WordItem(3, "sleeps", "verb", false),
                new WordItem(4, ".", "punctuation", false)
            ],
            correctOrder: [1, 2, 3, 4],
            hint: "The cat sleeps."
        },
        2: {
            words: [
                new WordItem(1, "A", "article", true),
                new WordItem(2, "happy", "adjective", false),
                new WordItem(3, "dog", "noun", false),
                new WordItem(4, "runs", "verb", false),
                new WordItem(5, ".", "punctuation", false)
            ],
            correctOrder: [1, 2, 3, 4, 5],
            hint: "A happy dog runs."
        },
        3: {
            words: [
                new WordItem(1, "The", "article", true),
                new WordItem(2, "little", "adjective", false),
                new WordItem(3, "bird", "noun", false),
                new WordItem(4, "sings", "verb", false),
                new WordItem(5, "loudly", "adverb", false),
                new WordItem(6, ".", "punctuation", false)
            ],
            correctOrder: [1, 2, 3, 4, 5, 6],
            hint: "The little bird sings loudly."
        },
        4: {
            words: [
                new WordItem(1, "The", "article", true),
                new WordItem(2, "brave", "adjective", false),
                new WordItem(3, "knight", "noun", false),
                new WordItem(4, "fights", "verb", false),
                new WordItem(5, "and", "connective", false),
                new WordItem(6, "wins", "verb", false),
                new WordItem(7, ".", "punctuation", false)
            ],
            correctOrder: [1, 2, 3, 4, 5, 6, 7],
            hint: "The brave knight fights and wins."
        },
        5: {
            words: [
                new WordItem(1, "The", "article", true),
                new WordItem(2, "mysterious", "adjective", false),
                new WordItem(3, "wizard", "noun", false),
                new WordItem(4, "travels", "verb", false),
                new WordItem(5, "through", "preposition", false),
                new WordItem(6, "the", "article", false),
                new WordItem(7, "forest", "noun", false),
                new WordItem(8, ".", "punctuation", false)
            ],
            correctOrder: [1, 2, 3, 4, 5, 6, 7, 8],
            hint: "The mysterious wizard travels through the forest."
        }
    };
}

// ============================================
// DOM REFERENCES
// ============================================

let sentenceContainer;
let bankContainer;
let sentenceStrip;
let checkBtn;
let resetBtn;
let nextBtn;
let feedbackArea;
let feedbackMessage;
let scoreValue;
let levelIndicator;
let sillyModeToggle;
let confettiCanvas;
let confettiCtx;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Get DOM references
    sentenceContainer = document.getElementById('sentence-container');
    bankContainer = document.getElementById('bank-container');
    sentenceStrip = document.getElementById('sentence-strip');
    checkBtn = document.getElementById('check-btn');
    resetBtn = document.getElementById('reset-btn');
    nextBtn = document.getElementById('next-btn');
    feedbackArea = document.getElementById('feedback-area');
    feedbackMessage = document.getElementById('feedback-message');
    scoreValue = document.getElementById('score-value');
    levelIndicator = document.getElementById('level-indicator');
    sillyModeToggle = document.getElementById('silly-mode-toggle');
    confettiCanvas = document.getElementById('confetti-canvas');
    confettiCtx = confettiCanvas.getContext('2d');

    // Setup canvas size
    resizeConfettiCanvas();
    window.addEventListener('resize', resizeConfettiCanvas);

    // Event listeners
    checkBtn.addEventListener('click', checkSentence);
    resetBtn.addEventListener('click', resetLevel);
    nextBtn.addEventListener('click', nextLevel);
    sillyModeToggle.addEventListener('change', toggleMode);

    // Back button - go to main menu
    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.href = '../../index.html';
    });

    // Global mouse/touch events for dragging
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);

    // Load word bank first, then initialize game
    await loadWordBank();
    loadLevel(gameState.currentLevel);
});

function resizeConfettiCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}

// ============================================
// LEVEL MANAGEMENT
// ============================================

function loadLevel(level) {
    const data = levelData[level];
    if (!data) {
        console.log('No more levels!');
        return;
    }

    gameState.currentLevel = level;
    gameState.currentLevelData = [...data.words];
    gameState.correctAnswer = data.correctOrder;

    // Update UI
    levelIndicator.textContent = `Level ${level}: Build the Sentence`;

    // Clear containers
    sentenceContainer.innerHTML = '';
    bankContainer.innerHTML = '';

    // Hide feedback and next button
    feedbackArea.classList.add('hidden');
    nextBtn.classList.add('hidden');
    checkBtn.classList.remove('hidden');

    // Shuffle words and render to word bank
    const shuffledWords = [...data.words].sort(() => Math.random() - 0.5);
    shuffledWords.forEach(word => {
        const card = createWordCard(word);
        bankContainer.appendChild(card);
    });
}

function resetLevel() {
    loadLevel(gameState.currentLevel);
}

function nextLevel() {
    if (levelData[gameState.currentLevel + 1]) {
        loadLevel(gameState.currentLevel + 1);
    } else {
        // Loop back to level 1 or show completion
        loadLevel(1);
    }
}

// ============================================
// WORD CARD CREATION
// ============================================

function createWordCard(wordItem) {
    const card = document.createElement('div');
    card.className = `word-card ${wordItem.type}`;
    card.textContent = wordItem.text;
    card.dataset.wordId = wordItem.id;
    card.dataset.wordType = wordItem.type;
    card.dataset.isCapitalized = wordItem.isCapitalized;

    // Event listeners for drag
    card.addEventListener('mousedown', handleDragStart);
    card.addEventListener('touchstart', handleDragStart, { passive: false });

    return card;
}

// ============================================
// DRAG AND DROP ENGINE
// ============================================

let dragStartX = 0;
let dragStartY = 0;
let originalParent = null;

function handleDragStart(e) {
    e.preventDefault();

    const card = e.target.closest('.word-card');
    if (!card) return;

    gameState.isDragging = true;
    gameState.draggedElement = card;
    originalParent = card.parentElement;

    // Get cursor/touch position
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

    // Store initial position
    const rect = card.getBoundingClientRect();
    gameState.dragOffsetX = clientX - rect.left;
    gameState.dragOffsetY = clientY - rect.top;
    dragStartX = rect.left;
    dragStartY = rect.top;

    // Style for dragging - use fixed positioning
    card.classList.add('dragging');
    card.style.position = 'fixed';
    card.style.left = rect.left + 'px';
    card.style.top = rect.top + 'px';
    card.style.width = rect.width + 'px';
    card.style.zIndex = '1000';
    card.style.margin = '0';
}

function handleDragMove(e) {
    if (!gameState.isDragging || !gameState.draggedElement) return;

    e.preventDefault();

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    // Move the card
    const newLeft = clientX - gameState.dragOffsetX;
    const newTop = clientY - gameState.dragOffsetY;
    gameState.draggedElement.style.left = newLeft + 'px';
    gameState.draggedElement.style.top = newTop + 'px';

    // Check if over sentence strip for visual feedback
    const stripRect = sentenceStrip.getBoundingClientRect();
    if (isPointInRect(clientX, clientY, stripRect)) {
        sentenceStrip.classList.add('drag-over');
    } else {
        sentenceStrip.classList.remove('drag-over');
    }
}

function handleDragEnd(e) {
    if (!gameState.isDragging || !gameState.draggedElement) return;

    const card = gameState.draggedElement;
    card.classList.remove('dragging');
    sentenceStrip.classList.remove('drag-over');

    // Get final position (center of card)
    const cardRect = card.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;

    // Reset card inline styles first
    card.style.position = '';
    card.style.left = '';
    card.style.top = '';
    card.style.width = '';
    card.style.zIndex = '';
    card.style.margin = '';

    // Check drop zones
    const stripRect = sentenceStrip.getBoundingClientRect();
    const bankRect = document.getElementById('word-bank').getBoundingClientRect();

    let targetContainer = null;
    let insertPosition = null;

    if (isPointInRect(cardCenterX, cardCenterY, stripRect)) {
        // Dropped on sentence strip - calculate insert position
        targetContainer = sentenceContainer;
        insertPosition = findInsertPosition(cardCenterX);
    } else if (isPointInRect(cardCenterX, cardCenterY, bankRect)) {
        // Dropped on word bank
        targetContainer = bankContainer;
    } else {
        // Dropped elsewhere - return to word bank
        targetContainer = bankContainer;
    }

    // Move card to target container
    if (targetContainer === sentenceContainer && insertPosition !== null) {
        const existingCards = Array.from(sentenceContainer.querySelectorAll('.word-card'));
        if (insertPosition >= existingCards.length) {
            sentenceContainer.appendChild(card);
        } else {
            sentenceContainer.insertBefore(card, existingCards[insertPosition]);
        }
    } else {
        targetContainer.appendChild(card);
    }

    // Add pop animation
    card.classList.add('pop-in');
    setTimeout(() => card.classList.remove('pop-in'), 300);

    // Reset drag state
    gameState.isDragging = false;
    gameState.draggedElement = null;
    originalParent = null;
}

function findInsertPosition(dropX) {
    const existingCards = Array.from(sentenceContainer.querySelectorAll('.word-card'));

    if (existingCards.length === 0) {
        return 0;
    }

    // Find where to insert based on X coordinate
    for (let i = 0; i < existingCards.length; i++) {
        const cardRect = existingCards[i].getBoundingClientRect();
        const cardCenterX = cardRect.left + cardRect.width / 2;

        if (dropX < cardCenterX) {
            return i;
        }
    }

    return existingCards.length;
}

function isPointInRect(x, y, rect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

// ============================================
// SENTENCE VALIDATION
// ============================================

function getSentenceFromStrip() {
    const cards = sentenceContainer.querySelectorAll('.word-card');
    return Array.from(cards).map(card => ({
        id: parseInt(card.dataset.wordId),
        text: card.textContent,
        type: card.dataset.wordType,
        isCapitalized: card.dataset.isCapitalized === 'true'
    }));
}

function checkSentence() {
    const sentence = getSentenceFromStrip();

    if (sentence.length === 0) {
        showFeedback("Drop some words on the line first!", 'error');
        return;
    }

    const userOrder = sentence.map(w => w.id);
    const correctOrder = gameState.correctAnswer;

    // Validation rules
    let isCorrect = true;
    let errorType = null;

    // Rule A: First word must be capitalized
    if (sentence.length > 0 && !sentence[0].isCapitalized) {
        isCorrect = false;
        errorType = 'capitalization';
    }

    // Rule B: Last word must be punctuation
    if (sentence.length > 0 && sentence[sentence.length - 1].type !== 'punctuation') {
        isCorrect = false;
        errorType = 'punctuation';
    }

    // Rule C: Word order must match (in strict mode)
    if (gameState.mode === 'strict') {
        if (userOrder.length !== correctOrder.length ||
            !userOrder.every((id, idx) => id === correctOrder[idx])) {
            isCorrect = false;
            if (!errorType) errorType = 'order';
        }
    } else {
        // Silly Mode: Check structure only
        isCorrect = checkStructure(sentence);
        if (!isCorrect && !errorType) errorType = 'structure';
    }

    if (isCorrect) {
        handleCorrect();
    } else {
        handleIncorrect(errorType);
    }
}

function checkStructure(sentence) {
    // Basic structure check for Silly Mode
    // [Article] ... [Punctuation]
    if (sentence.length < 2) return false;
    if (sentence[0].type !== 'article') return false;
    if (sentence[sentence.length - 1].type !== 'punctuation') return false;

    // Must have at least one noun and one verb
    const hasNoun = sentence.some(w => w.type === 'noun');
    const hasVerb = sentence.some(w => w.type === 'verb');

    return hasNoun && hasVerb;
}

function handleCorrect() {
    // Update score
    gameState.score += 10;
    scoreValue.textContent = gameState.score;

    // Show success feedback
    showFeedback("🎉 Brilliant! That's correct!", 'success');

    // Play success sound (placeholder)
    playSound('success');

    // Trigger confetti
    triggerConfetti();

    // Hide check button, show next button
    checkBtn.classList.add('hidden');
    nextBtn.classList.remove('hidden');

    // Speak the sentence
    speakSentence();
}

function handleIncorrect(errorType) {
    let message = "Try again!";
    let elementsToShake = [];

    switch (errorType) {
        case 'capitalization':
            message = "🤔 Check the first word - does it start with a capital letter?";
            const firstCard = sentenceContainer.querySelector('.word-card');
            if (firstCard) elementsToShake.push(firstCard);
            break;
        case 'punctuation':
            message = "🤔 Don't forget the full stop at the end!";
            const lastCard = sentenceContainer.querySelector('.word-card:last-child');
            if (lastCard) elementsToShake.push(lastCard);
            break;
        case 'order':
            message = "🤔 The words are in the wrong order. Try again!";
            elementsToShake = Array.from(sentenceContainer.querySelectorAll('.word-card'));
            break;
        case 'structure':
            message = "🤔 Your sentence needs a subject and a verb!";
            elementsToShake = Array.from(sentenceContainer.querySelectorAll('.word-card'));
            break;
    }

    showFeedback(message, 'error');
    playSound('error');

    // Shake the relevant elements
    elementsToShake.forEach(el => {
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 500);
    });
}

function showFeedback(message, type) {
    feedbackArea.classList.remove('hidden', 'success', 'error');
    feedbackArea.classList.add(type);
    feedbackMessage.textContent = message;
}

// ============================================
// MODE TOGGLE
// ============================================

function toggleMode() {
    gameState.mode = sillyModeToggle.checked ? 'silly' : 'strict';
    console.log('Mode switched to:', gameState.mode);
}

// ============================================
// AUDIO
// ============================================

function playSound(type) {
    // Placeholder for sound effects
    console.log('Playing sound:', type);
}

function speakSentence() {
    const sentence = getSentenceFromStrip();
    const text = sentence.map(w => w.text).join(' ');

    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-GB';
        utterance.rate = 0.9;

        // Try to use a British voice
        const voices = speechSynthesis.getVoices();
        const britishVoice = voices.find(v => v.lang === 'en-GB') ||
            voices.find(v => v.name.includes('UK')) ||
            voices.find(v => v.name.includes('British'));
        if (britishVoice) utterance.voice = britishVoice;

        speechSynthesis.speak(utterance);
    }
}

// ============================================
// CONFETTI ANIMATION
// ============================================

const confettiParticles = [];

function triggerConfetti() {
    // Create particles
    for (let i = 0; i < 100; i++) {
        confettiParticles.push({
            x: Math.random() * confettiCanvas.width,
            y: -20,
            size: Math.random() * 10 + 5,
            color: `hsl(${Math.random() * 360}, 70%, 60%)`,
            speedX: (Math.random() - 0.5) * 6,
            speedY: Math.random() * 4 + 2,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10
        });
    }

    // Start animation if not already running
    if (confettiParticles.length === 100) {
        animateConfetti();
    }
}

function animateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    for (let i = confettiParticles.length - 1; i >= 0; i--) {
        const p = confettiParticles[i];

        // Update position
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        p.speedY += 0.1; // Gravity

        // Draw
        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate((p.rotation * Math.PI) / 180);
        confettiCtx.fillStyle = p.color;
        confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        confettiCtx.restore();

        // Remove if off screen
        if (p.y > confettiCanvas.height + 50) {
            confettiParticles.splice(i, 1);
        }
    }

    if (confettiParticles.length > 0) {
        requestAnimationFrame(animateConfetti);
    }
}
