/**
 * May's Sentence Lab - Engine v3
 * ================================
 * Mission Board Grid + "Dealer" System
 * Ensures unique word distribution across tiles
 * For UK Key Stage 1/2 (ages 6-10)
 */

// ============================================
// CONSTANTS
// ============================================

const TILE_COUNT = 20;
const TILE_COLORS = ['pink', 'blue', 'green', 'yellow', 'purple', 'orange'];
const TILE_ICONS = ['📝', '✏️', '📖', '🎯', '💡', '🌟', '🔤', '📚'];
const STORAGE_KEY = 'may_mission_board_v1';
const SESSION_KEY = 'may_current_board';

// ============================================
// SENTENCE SKELETONS (Grammar Templates)
// ============================================

const SKELETONS = {
    1: [  // Simple (Level 1)
        ['article', 'noun', 'verb', 'punctuation'],
    ],
    2: [  // Medium (Level 2)
        ['article', 'adjective', 'noun', 'verb', 'punctuation'],
    ],
    3: [  // Complex (Level 3)
        ['article', 'adjective', 'noun', 'verb', 'adverb', 'punctuation'],
    ]
};

// ============================================
// DATA STRUCTURES
// ============================================

class WordItem {
    constructor(id, text, type, isCapitalized = false) {
        this.id = id;
        this.text = text;
        this.type = type;
        this.isCapitalized = isCapitalized;
    }
}

// ============================================
// GAME STATE
// ============================================

const gameState = {
    currentTileIndex: null,
    currentStreak: 0,
    isDragging: false,
    draggedElement: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
};

// Board data (generated for current session)
let boardData = [];

// User progress (persisted)
let userState = {
    completedTiles: [],
    totalScore: 0,
    highestStreak: 0,
};

// Word library
// Word library
let wordLibrary = [];
let sentenceLibrary = null; // New: Container for pre-generated sentences
let currentTheme = null;    // Current selected theme

// Dealer's deck (shuffled word pools)
let dealerDeck = {
    nouns: [],
    verbs: [],
    adjectives: [],
    adverbs: [],
    articles: [],
    connectives: [],
    prepositions: [],
    punctuation: []
};

// ============================================
// DOM REFERENCES
// ============================================

let boardView, missionBoard, gameModal, successModal;
let sentenceContainer, bankContainer, sentenceStrip;
let checkBtn, resetBtn, closeGameBtn;
let feedbackArea, feedbackMessage;
let streakValue, totalScoreEl, progressText, themeTag;
let streakOverlay, sillyIndicator;
let confettiCanvas, confettiCtx;

// Library version - increment this to force board regeneration
const LIBRARY_VERSION = 5;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // 🔄 RESET ON LOAD (User Request)
    // Clear all persistence to ensure fresh game every refresh
    try {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        console.log('🔄 Game state reset for fresh session');
    } catch (e) {
        console.warn('Could not clear storage', e);
    }

    initDOMReferences();
    loadUserState();      // Will load empty state since storage is cleared
    loadWordLibrary();      // Uses embedded word library
    loadSentenceLibrary();  // Uses embedded sentence database

    // Always generate fresh board since we wiped session
    initOrRestoreBoard();
    setupEventListeners();
    updateUI();
});

function initDOMReferences() {
    // Views
    boardView = document.getElementById('board-view');
    missionBoard = document.getElementById('mission-board');
    gameModal = document.getElementById('game-modal');
    successModal = document.getElementById('success-modal');

    // Game elements
    sentenceContainer = document.getElementById('sentence-container');
    bankContainer = document.getElementById('bank-container');
    sentenceStrip = document.getElementById('sentence-strip');

    // Buttons
    checkBtn = document.getElementById('check-btn');
    resetBtn = document.getElementById('reset-btn');
    closeGameBtn = document.getElementById('close-game-btn');

    // Displays
    feedbackArea = document.getElementById('feedback-area');
    feedbackMessage = document.getElementById('feedback-message');
    streakValue = document.getElementById('streak-value');
    totalScoreEl = document.getElementById('total-score');
    progressText = document.getElementById('progress-text');
    themeTag = document.getElementById('theme-tag');

    // Overlays
    streakOverlay = document.getElementById('streak-overlay');
    sillyIndicator = document.getElementById('silly-indicator');

    // Canvas
    confettiCanvas = document.getElementById('confetti-canvas');
    if (confettiCanvas) {
        confettiCtx = confettiCanvas.getContext('2d');
        resizeConfettiCanvas();
        window.addEventListener('resize', resizeConfettiCanvas);
    }
}

function setupEventListeners() {
    // Game controls
    if (checkBtn) checkBtn.addEventListener('click', checkSentence);
    if (resetBtn) resetBtn.addEventListener('click', resetCurrentTile);
    if (closeGameBtn) closeGameBtn.addEventListener('click', closeGameModal);

    // Board controls
    const refreshBtn = document.getElementById('refresh-board-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', refreshBoard);

    const resetDataBtn = document.getElementById('reset-data-btn');
    if (resetDataBtn) resetDataBtn.addEventListener('click', confirmResetData);

    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) homeBtn.addEventListener('click', () => {
        window.location.href = '../../index.html';
    });

    // Modal buttons
    const successCloseBtn = document.getElementById('success-close-btn');
    if (successCloseBtn) successCloseBtn.addEventListener('click', closeSuccessModal);

    const newBoardBtn = document.getElementById('new-board-btn');
    if (newBoardBtn) newBoardBtn.addEventListener('click', refreshBoard);

    // Modal backdrop click
    const gameBackdrop = document.getElementById('game-modal-backdrop');
    if (gameBackdrop) gameBackdrop.addEventListener('click', closeGameModal);

    // Drag events
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
}

// ============================================
// PERSISTENCE
// ============================================

function loadUserState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            userState = { ...userState, ...JSON.parse(saved) };
            console.log('✅ User state loaded:', userState);
        }
    } catch (e) {
        console.error('Error loading user state:', e);
    }
}

function saveUserState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userState));
    } catch (e) {
        console.error('Error saving user state:', e);
    }
}

function saveBoardToSession() {
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({
            boardData: boardData,
            currentTheme: currentTheme
        }));
    } catch (e) {
        console.error('Error saving board to session:', e);
    }
}

function loadBoardFromSession() {
    try {
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            if (data.boardData && data.currentTheme) {
                boardData = data.boardData;
                currentTheme = data.currentTheme;
                return true;
            }
        }
    } catch (e) {
        console.error('Error loading board from session:', e);
    }
    return false;
}

function confirmResetData() {
    if (confirm('🗑️ Reset ALL progress?\n\nThis will delete all completed tiles and scores.\n\nThis cannot be undone!')) {
        resetAllData();
    }
}

function resetAllData() {
    userState = {
        completedTiles: [],
        totalScore: 0,
        highestStreak: 0,
    };
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);

    gameState.currentStreak = 0;

    generateNewBoard();
    updateUI();

    alert('✅ Progress has been reset!');
}

// ============================================
// WORD LIBRARY
// ============================================

function loadWordLibrary() {
    // Use embedded word library for word type lookups
    // Sentences come from sentence_db.json
    wordLibrary = getDefaultWordLibrary();
    console.log(`✅ Word library loaded: ${wordLibrary.length} words (embedded)`);
}

function loadSentenceLibrary() {
    // Use embedded sentence database (from sentence_data.js)
    if (typeof SENTENCE_DATABASE !== 'undefined' && SENTENCE_DATABASE.themes) {
        sentenceLibrary = SENTENCE_DATABASE;
        console.log(`✅ Sentence library loaded: ${Object.keys(sentenceLibrary.themes).length} themes available`);
    } else {
        console.error('❌ SENTENCE_DATABASE not found or invalid format! Check sentence_data.js');
        sentenceLibrary = null;
    }
}

function getMissionSentences(level, count) {
    if (!sentenceLibrary || !currentTheme) return null;

    const themeData = sentenceLibrary.themes[currentTheme];
    if (!themeData || !themeData.levels || !themeData.levels[level]) return null;

    // Pick unique random sentences
    const pool = [...themeData.levels[level]];
    const picked = [];

    for (let i = 0; i < count; i++) {
        if (pool.length === 0) break;
        const idx = Math.floor(Math.random() * pool.length);
        picked.push(pool.splice(idx, 1)[0]);
    }

    return picked;
}

function getDefaultWordLibrary() {
    console.log('⚠️ Using embedded word library (fetch failed)');
    return [
        // ARTICLES (8)
        { id: "art_the", text: "The", type: "article", level: 1, isSilly: false, isCapitalized: true },
        { id: "art_a", text: "A", type: "article", level: 1, isSilly: false, isCapitalized: true },
        { id: "art_an", text: "An", type: "article", level: 1, isSilly: false, isCapitalized: true },
        { id: "art_my", text: "My", type: "article", level: 1, isSilly: false, isCapitalized: true },
        { id: "art_his", text: "His", type: "article", level: 2, isSilly: false, isCapitalized: true },
        { id: "art_her", text: "Her", type: "article", level: 2, isSilly: false, isCapitalized: true },
        { id: "art_our", text: "Our", type: "article", level: 2, isSilly: false, isCapitalized: true },
        { id: "art_their", text: "Their", type: "article", level: 3, isSilly: false, isCapitalized: true },

        // NOUNS - Animals (25)
        { id: "n_cat", text: "cat", type: "noun", level: 1, isSilly: false },
        { id: "n_dog", text: "dog", type: "noun", level: 1, isSilly: false },
        { id: "n_bird", text: "bird", type: "noun", level: 1, isSilly: false },
        { id: "n_fish", text: "fish", type: "noun", level: 1, isSilly: false },
        { id: "n_rabbit", text: "rabbit", type: "noun", level: 1, isSilly: false },
        { id: "n_horse", text: "horse", type: "noun", level: 1, isSilly: false },
        { id: "n_pig", text: "pig", type: "noun", level: 1, isSilly: false },
        { id: "n_cow", text: "cow", type: "noun", level: 1, isSilly: false },
        { id: "n_sheep", text: "sheep", type: "noun", level: 1, isSilly: false },
        { id: "n_frog", text: "frog", type: "noun", level: 1, isSilly: false },
        { id: "n_bee", text: "bee", type: "noun", level: 1, isSilly: false },
        { id: "n_spider", text: "spider", type: "noun", level: 2, isSilly: false },
        { id: "n_butterfly", text: "butterfly", type: "noun", level: 2, isSilly: false },
        { id: "n_dragon", text: "dragon", type: "noun", level: 2, isSilly: false },
        { id: "n_unicorn", text: "unicorn", type: "noun", level: 2, isSilly: false },
        { id: "n_dinosaur", text: "dinosaur", type: "noun", level: 2, isSilly: false },
        { id: "n_monster", text: "monster", type: "noun", level: 2, isSilly: false },
        { id: "n_toad", text: "toad", type: "noun", level: 2, isSilly: true },
        { id: "n_slug", text: "slug", type: "noun", level: 2, isSilly: true },
        { id: "n_worm", text: "worm", type: "noun", level: 1, isSilly: true },

        // NOUNS - People (15)
        { id: "n_mum", text: "mum", type: "noun", level: 1, isSilly: false },
        { id: "n_dad", text: "dad", type: "noun", level: 1, isSilly: false },
        { id: "n_boy", text: "boy", type: "noun", level: 1, isSilly: false },
        { id: "n_girl", text: "girl", type: "noun", level: 1, isSilly: false },
        { id: "n_baby", text: "baby", type: "noun", level: 1, isSilly: false },
        { id: "n_teacher", text: "teacher", type: "noun", level: 1, isSilly: false },
        { id: "n_friend", text: "friend", type: "noun", level: 1, isSilly: false },
        { id: "n_wizard", text: "wizard", type: "noun", level: 2, isSilly: false },
        { id: "n_witch", text: "witch", type: "noun", level: 2, isSilly: false },
        { id: "n_princess", text: "princess", type: "noun", level: 2, isSilly: false },
        { id: "n_knight", text: "knight", type: "noun", level: 2, isSilly: false },
        { id: "n_pirate", text: "pirate", type: "noun", level: 2, isSilly: false },
        { id: "n_robot", text: "robot", type: "noun", level: 2, isSilly: false },
        { id: "n_alien", text: "alien", type: "noun", level: 2, isSilly: false },
        { id: "n_giant", text: "giant", type: "noun", level: 2, isSilly: false },

        // NOUNS - Things (20)
        { id: "n_ball", text: "ball", type: "noun", level: 1, isSilly: false },
        { id: "n_book", text: "book", type: "noun", level: 1, isSilly: false },
        { id: "n_cake", text: "cake", type: "noun", level: 1, isSilly: false },
        { id: "n_pizza", text: "pizza", type: "noun", level: 1, isSilly: false },
        { id: "n_apple", text: "apple", type: "noun", level: 1, isSilly: false },
        { id: "n_banana", text: "banana", type: "noun", level: 1, isSilly: false },
        { id: "n_car", text: "car", type: "noun", level: 1, isSilly: false },
        { id: "n_train", text: "train", type: "noun", level: 1, isSilly: false },
        { id: "n_bus", text: "bus", type: "noun", level: 1, isSilly: false },
        { id: "n_tree", text: "tree", type: "noun", level: 1, isSilly: false },
        { id: "n_house", text: "house", type: "noun", level: 1, isSilly: false },
        { id: "n_castle", text: "castle", type: "noun", level: 2, isSilly: false },
        { id: "n_spaceship", text: "spaceship", type: "noun", level: 2, isSilly: false },
        { id: "n_wand", text: "wand", type: "noun", level: 2, isSilly: false },
        { id: "n_potion", text: "potion", type: "noun", level: 2, isSilly: false },
        { id: "n_slime", text: "slime", type: "noun", level: 1, isSilly: true },
        { id: "n_bogey", text: "bogey", type: "noun", level: 2, isSilly: true },
        { id: "n_pants", text: "pants", type: "noun", level: 1, isSilly: true },
        { id: "n_sausage", text: "sausage", type: "noun", level: 1, isSilly: true },
        { id: "n_jelly", text: "jelly", type: "noun", level: 1, isSilly: true },

        // VERBS (40)
        { id: "v_runs", text: "runs", type: "verb", level: 1, isSilly: false },
        { id: "v_jumps", text: "jumps", type: "verb", level: 1, isSilly: false },
        { id: "v_eats", text: "eats", type: "verb", level: 1, isSilly: false },
        { id: "v_sleeps", text: "sleeps", type: "verb", level: 1, isSilly: false },
        { id: "v_plays", text: "plays", type: "verb", level: 1, isSilly: false },
        { id: "v_reads", text: "reads", type: "verb", level: 1, isSilly: false },
        { id: "v_sings", text: "sings", type: "verb", level: 1, isSilly: false },
        { id: "v_dances", text: "dances", type: "verb", level: 1, isSilly: false },
        { id: "v_swims", text: "swims", type: "verb", level: 1, isSilly: false },
        { id: "v_flies", text: "flies", type: "verb", level: 2, isSilly: false },
        { id: "v_walks", text: "walks", type: "verb", level: 1, isSilly: false },
        { id: "v_climbs", text: "climbs", type: "verb", level: 2, isSilly: false },
        { id: "v_laughs", text: "laughs", type: "verb", level: 1, isSilly: false },
        { id: "v_cries", text: "cries", type: "verb", level: 1, isSilly: false },
        { id: "v_shouts", text: "shouts", type: "verb", level: 2, isSilly: false },
        { id: "v_hides", text: "hides", type: "verb", level: 2, isSilly: false },
        { id: "v_loves", text: "loves", type: "verb", level: 1, isSilly: false },
        { id: "v_throws", text: "throws", type: "verb", level: 2, isSilly: false },
        { id: "v_catches", text: "catches", type: "verb", level: 2, isSilly: false },
        { id: "v_kicks", text: "kicks", type: "verb", level: 1, isSilly: false },
        { id: "v_drinks", text: "drinks", type: "verb", level: 1, isSilly: false },
        { id: "v_cooks", text: "cooks", type: "verb", level: 2, isSilly: false },
        { id: "v_builds", text: "builds", type: "verb", level: 2, isSilly: false },
        { id: "v_explodes", text: "explodes", type: "verb", level: 2, isSilly: false },
        { id: "v_zooms", text: "zooms", type: "verb", level: 1, isSilly: false },
        { id: "v_crashes", text: "crashes", type: "verb", level: 2, isSilly: false },
        { id: "v_vanishes", text: "vanishes", type: "verb", level: 3, isSilly: false },
        { id: "v_sparkles", text: "sparkles", type: "verb", level: 2, isSilly: false },
        { id: "v_glows", text: "glows", type: "verb", level: 2, isSilly: false },
        { id: "v_roars", text: "roars", type: "verb", level: 2, isSilly: false },
        { id: "v_stomps", text: "stomps", type: "verb", level: 2, isSilly: false },
        { id: "v_splashes", text: "splashes", type: "verb", level: 2, isSilly: false },
        { id: "v_wobbles", text: "wobbles", type: "verb", level: 2, isSilly: true },
        { id: "v_wiggles", text: "wiggles", type: "verb", level: 2, isSilly: true },
        { id: "v_squishes", text: "squishes", type: "verb", level: 2, isSilly: true },
        { id: "v_splats", text: "splats", type: "verb", level: 2, isSilly: true },
        { id: "v_burps", text: "burps", type: "verb", level: 1, isSilly: true },
        { id: "v_giggles", text: "giggles", type: "verb", level: 2, isSilly: true },
        { id: "v_snores", text: "snores", type: "verb", level: 2, isSilly: true },
        { id: "v_chomps", text: "chomps", type: "verb", level: 2, isSilly: true },

        // ADJECTIVES (35)
        { id: "adj_big", text: "big", type: "adjective", level: 1, isSilly: false },
        { id: "adj_small", text: "small", type: "adjective", level: 1, isSilly: false },
        { id: "adj_happy", text: "happy", type: "adjective", level: 1, isSilly: false },
        { id: "adj_sad", text: "sad", type: "adjective", level: 1, isSilly: false },
        { id: "adj_angry", text: "angry", type: "adjective", level: 2, isSilly: false },
        { id: "adj_scared", text: "scared", type: "adjective", level: 2, isSilly: false },
        { id: "adj_brave", text: "brave", type: "adjective", level: 2, isSilly: false },
        { id: "adj_clever", text: "clever", type: "adjective", level: 2, isSilly: false },
        { id: "adj_fast", text: "fast", type: "adjective", level: 1, isSilly: false },
        { id: "adj_slow", text: "slow", type: "adjective", level: 1, isSilly: false },
        { id: "adj_hot", text: "hot", type: "adjective", level: 1, isSilly: false },
        { id: "adj_cold", text: "cold", type: "adjective", level: 1, isSilly: false },
        { id: "adj_noisy", text: "noisy", type: "adjective", level: 2, isSilly: false },
        { id: "adj_quiet", text: "quiet", type: "adjective", level: 2, isSilly: false },
        { id: "adj_beautiful", text: "beautiful", type: "adjective", level: 2, isSilly: false },
        { id: "adj_shiny", text: "shiny", type: "adjective", level: 2, isSilly: false },
        { id: "adj_sparkly", text: "sparkly", type: "adjective", level: 2, isSilly: false },
        { id: "adj_fluffy", text: "fluffy", type: "adjective", level: 2, isSilly: false },
        { id: "adj_scary", text: "scary", type: "adjective", level: 2, isSilly: false },
        { id: "adj_magical", text: "magical", type: "adjective", level: 2, isSilly: false },
        { id: "adj_invisible", text: "invisible", type: "adjective", level: 3, isSilly: false },
        { id: "adj_giant", text: "giant", type: "adjective", level: 2, isSilly: false },
        { id: "adj_tiny", text: "tiny", type: "adjective", level: 2, isSilly: false },
        { id: "adj_brilliant", text: "brilliant", type: "adjective", level: 2, isSilly: false },
        { id: "adj_lovely", text: "lovely", type: "adjective", level: 2, isSilly: false },
        { id: "adj_grumpy", text: "grumpy", type: "adjective", level: 2, isSilly: false },
        { id: "adj_hungry", text: "hungry", type: "adjective", level: 1, isSilly: false },
        { id: "adj_sleepy", text: "sleepy", type: "adjective", level: 1, isSilly: false },
        { id: "adj_silly", text: "silly", type: "adjective", level: 1, isSilly: true },
        { id: "adj_funny", text: "funny", type: "adjective", level: 1, isSilly: true },
        { id: "adj_smelly", text: "smelly", type: "adjective", level: 1, isSilly: true },
        { id: "adj_stinky", text: "stinky", type: "adjective", level: 1, isSilly: true },
        { id: "adj_slimy", text: "slimy", type: "adjective", level: 2, isSilly: true },
        { id: "adj_wobbly", text: "wobbly", type: "adjective", level: 2, isSilly: true },
        { id: "adj_bonkers", text: "bonkers", type: "adjective", level: 2, isSilly: true },

        // ADVERBS (15)
        { id: "adv_quickly", text: "quickly", type: "adverb", level: 3, isSilly: false },
        { id: "adv_slowly", text: "slowly", type: "adverb", level: 3, isSilly: false },
        { id: "adv_loudly", text: "loudly", type: "adverb", level: 3, isSilly: false },
        { id: "adv_quietly", text: "quietly", type: "adverb", level: 3, isSilly: false },
        { id: "adv_happily", text: "happily", type: "adverb", level: 3, isSilly: false },
        { id: "adv_sadly", text: "sadly", type: "adverb", level: 3, isSilly: false },
        { id: "adv_angrily", text: "angrily", type: "adverb", level: 3, isSilly: false },
        { id: "adv_suddenly", text: "suddenly", type: "adverb", level: 3, isSilly: false },
        { id: "adv_carefully", text: "carefully", type: "adverb", level: 3, isSilly: false },
        { id: "adv_bravely", text: "bravely", type: "adverb", level: 3, isSilly: false },
        { id: "adv_wildly", text: "wildly", type: "adverb", level: 3, isSilly: false },
        { id: "adv_noisily", text: "noisily", type: "adverb", level: 3, isSilly: true },
        { id: "adv_messily", text: "messily", type: "adverb", level: 3, isSilly: true },
        { id: "adv_crazily", text: "crazily", type: "adverb", level: 3, isSilly: true },
        { id: "adv_greedily", text: "greedily", type: "adverb", level: 3, isSilly: false },

        // PUNCTUATION (3)
        { id: "punc_dot", text: ".", type: "punctuation", level: 1, isSilly: false },
        { id: "punc_question", text: "?", type: "punctuation", level: 2, isSilly: false },
        { id: "punc_exclaim", text: "!", type: "punctuation", level: 2, isSilly: false }
    ];
}

// ============================================
// THE DEALER ENGINE
// ============================================

class Dealer {

    /**
     * Generate board data with unique word distribution
     * @param {number} tileCount - Number of tiles to generate
     * @returns {Array} Array of tile objects with pre-dealt word hands
     */
    static generateBoard(tileCount) {
        console.log(`🎲 Dealing ${tileCount} unique missions...`);

        // Step A: Master Shuffle - Create shuffled pools by type
        this.shuffleDecks();

        const tiles = [];

        // Step B: Deal words to each tile
        for (let i = 0; i < tileCount; i++) {
            const tileId = i + 1;

            // Assign random difficulty (1-4)
            // Updated to support level 4 (silly)
            const difficulty = this.assignDifficulty(tileId, tileCount);

            // If we have a sentence library, try to use it
            let hand;
            let isSilly = false;

            if (sentenceLibrary) {
                // If it's level 4, it's inherently silly
                if (difficulty === 4) isSilly = true;

                // Get a sentence for this difficulty (level keys are strings in JSON)
                const sentences = getMissionSentences(String(difficulty), 1);
                if (sentences && sentences.length > 0) {
                    hand = this.dealFromSentence(sentences[0], tileId);
                }
            }

            // If no sentence found, try a different level as fallback
            if (!hand && sentenceLibrary) {
                // Try levels 1-4 until we find a sentence
                for (let lvl = 1; lvl <= 4 && !hand; lvl++) {
                    const sentences = getMissionSentences(String(lvl), 1);
                    if (sentences && sentences.length > 0) {
                        hand = this.dealFromSentence(sentences[0], tileId);
                        console.warn(`⚠️ Used level ${lvl} sentence for tile ${tileId} (wanted level ${difficulty})`);
                    }
                }
            }

            // Last resort fallback to generative (should never happen with 1685 sentences)
            if (!hand) {
                console.error(`❌ No sentence found for tile ${tileId}, using generative fallback`);
                // 20% chance of silly tile (if not already level 4)
                isSilly = difficulty === 4 || Math.random() < 0.2;
                if (difficulty === 4) isSilly = true; // Ensure level 4 is silly

                // Get skeleton for this difficulty (clamp to 3 for generative skeletons)
                const genDifficulty = Math.min(difficulty, 3);
                const skeleton = this.pickSkeleton(genDifficulty);

                // Deal words for this skeleton
                hand = this.dealHand(skeleton, isSilly, tileId);
            }

            // Random color and icon
            const color = TILE_COLORS[i % TILE_COLORS.length];
            const icon = TILE_ICONS[Math.floor(Math.random() * TILE_ICONS.length)];

            tiles.push({
                id: tileId,
                difficulty: difficulty,
                isSilly: isSilly,
                color: color,
                icon: icon,
                hand: hand,
                skeleton: hand.skeleton || null
            });

            // Log the generated sentence
            console.log(`   Tile ${tileId}: "${hand.hint}" ${isSilly ? '👾' : ''}`);
        }

        console.log(`✅ Board generated with ${tiles.length} unique tiles`);
        return tiles;
    }

    /**
     * Parse a pre-generated sentence into a hand
     */
    static dealFromSentence(text, tileId) {
        // Strip punctuation for word processing but keep for last token
        // Simple tokenizer
        const cleanText = text.replace(/([.?!])$/, " $1");
        const tokens = cleanText.split(/\s+/).filter(t => t.length > 0);

        const words = [];
        let wordId = 1;

        tokens.forEach((token, index) => {
            // Check if it's punctuation
            const isPunctuation = ['.', '?', '!'].includes(token);

            // Try to find type in library
            let type = 'noun'; // Default
            if (isPunctuation) {
                type = 'punctuation';
            } else {
                // Look up in word library (case insensitive)
                const match = wordLibrary.find(w => w.text.toLowerCase() === token.toLowerCase());
                if (match) type = match.type;
                else {
                    // Heuristics
                    if (index === 0) type = 'article'; // Often starts with article
                    // Could add more heuristics here
                }
            }

            const isCapitalized = index === 0; // Only capitalize first word in sentence

            words.push(new WordItem(
                wordId,
                token,
                type,
                isCapitalized
            ));
            wordId++;
        });

        const correctOrder = words.map(w => w.id);

        return {
            words: words,
            correctOrder: correctOrder,
            hint: text,
            skeleton: null // Not generated from skeleton
        };
    }

    /**
     * Shuffle the entire word library into separate pools
     */
    static shuffleDecks() {
        // Reset decks
        dealerDeck = {
            nouns: [],
            verbs: [],
            adjectives: [],
            adverbs: [],
            articles: [],
            connectives: [],
            prepositions: [],
            punctuation: []
        };

        // Sort words into pools and shuffle
        wordLibrary.forEach(word => {
            const pool = this.getPool(word.type);
            if (pool) pool.push({ ...word });
        });

        // Shuffle each pool
        Object.keys(dealerDeck).forEach(key => {
            dealerDeck[key] = this.shuffle(dealerDeck[key]);
        });

        console.log('🃏 Dealer decks shuffled:');
        console.log(`   📦 Nouns: ${dealerDeck.nouns.length}`);
        console.log(`   📦 Verbs: ${dealerDeck.verbs.length}`);
        console.log(`   📦 Adjectives: ${dealerDeck.adjectives.length}`);
        console.log(`   📦 Adverbs: ${dealerDeck.adverbs.length}`);
        console.log(`   📦 Articles: ${dealerDeck.articles.length}`);
    }

    static getPool(type) {
        const map = {
            'noun': dealerDeck.nouns,
            'verb': dealerDeck.verbs,
            'adjective': dealerDeck.adjectives,
            'adverb': dealerDeck.adverbs,
            'article': dealerDeck.articles,
            'connective': dealerDeck.connectives,
            'preposition': dealerDeck.prepositions,
            'punctuation': dealerDeck.punctuation
        };
        return map[type];
    }

    /**
     * Assign difficulty based on position (gradual increase)
     */
    static assignDifficulty(tileId, total) {
        // First quarter: Level 1
        // Second quarter: Level 2
        // Third quarter: Level 3
        // Last quarter: Level 4 (Silly/Challenge)
        const position = tileId / total;

        if (position <= 0.25) {
            return 1;
        } else if (position <= 0.50) {
            return 2;
        } else if (position <= 0.75) {
            return 3;
        } else {
            return 4;
        }
    }

    static pickSkeleton(difficulty) {
        const skeletons = SKELETONS[difficulty] || SKELETONS[1];
        return skeletons[Math.floor(Math.random() * skeletons.length)];
    }

    /**
     * Deal a unique hand of words for a tile
     */
    static dealHand(skeleton, isSilly, tileId) {
        const words = [];
        let wordId = 1;

        for (const wordType of skeleton) {
            const word = this.drawWord(wordType, isSilly);
            if (word) {
                const isCapitalized = wordId === 1 || word.isCapitalized === true;
                words.push(new WordItem(
                    wordId,
                    isCapitalized ? this.capitalizeFirst(word.text) : word.text,
                    word.type,
                    isCapitalized
                ));
                wordId++;
            }
        }

        // Build correct order
        const correctOrder = words.map(w => w.id);
        const hint = words.map(w => w.text).join(' ');

        return {
            words: words,
            correctOrder: correctOrder,
            hint: hint
        };
    }

    /**
     * Draw a word from the deck (with preference for silly words if enabled)
     */
    static drawWord(type, preferSilly = false) {
        const pool = this.getPool(type);
        if (!pool || pool.length === 0) {
            // Deck exhausted - reshuffle this type from library
            console.warn(`⚠️ ${type} deck exhausted, reshuffling...`);
            this.reshuffleType(type);
            if (pool.length === 0) return null;
        }

        // If preferSilly, try to find a silly word first
        if (preferSilly) {
            const sillyIndex = pool.findIndex(w => w.isSilly === true);
            if (sillyIndex !== -1) {
                return pool.splice(sillyIndex, 1)[0];
            }
        }

        // Pop from front of deck
        return pool.shift();
    }

    static reshuffleType(type) {
        const pool = this.getPool(type);
        const words = wordLibrary.filter(w => w.type === type);
        pool.push(...this.shuffle(words.map(w => ({ ...w }))));
    }

    static capitalizeFirst(str) {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// ============================================
// BOARD MANAGEMENT
// ============================================

function initOrRestoreBoard() {
    // Try to restore from session first
    if (loadBoardFromSession()) {
        console.log('📋 Board restored from session');
        renderBoard();
    } else {
        generateNewBoard();
    }
}


function generateNewBoard() {
    // Pick a random theme
    if (sentenceLibrary && sentenceLibrary.themes) {
        const themeKeys = Object.keys(sentenceLibrary.themes);
        currentTheme = themeKeys[Math.floor(Math.random() * themeKeys.length)];
        console.log(`🎨 Selected theme: ${currentTheme}`);
    }

    boardData = Dealer.generateBoard(TILE_COUNT);
    saveBoardToSession();
    renderBoard();
}

function refreshBoard() {
    if (confirm('🔄 Generate new missions?\n\nCurrent board will be replaced.')) {
        generateNewBoard();
        updateUI();
    }
}

function renderBoard() {
    if (!missionBoard) return;

    missionBoard.innerHTML = '';

    boardData.forEach((tile, index) => {
        const tileEl = document.createElement('div');
        tileEl.className = `mission-tile color-${tile.color}`;
        tileEl.dataset.tileIndex = index;

        // Add completed class if done
        if (userState.completedTiles.includes(tile.id)) {
            tileEl.classList.add('completed');
        }

        // Add silly class
        if (tile.isSilly) {
            tileEl.classList.add('silly-tile');
        }

        // Tile content
        const isCompleted = userState.completedTiles.includes(tile.id);

        tileEl.innerHTML = `
            <span class="tile-stars">${'⭐'.repeat(tile.difficulty)}</span>
            ${isCompleted
                ? '<span class="tile-checkmark">✅</span>'
                : `<span class="tile-icon">${tile.icon}</span>`
            }
            <span class="tile-number">#${tile.id}</span>
        `;

        // Click handler (only if not completed)
        if (!isCompleted) {
            tileEl.addEventListener('click', () => openTile(index));
        }

        missionBoard.appendChild(tileEl);
    });

    checkBoardCompletion();
}

function checkBoardCompletion() {
    const completedCount = userState.completedTiles.filter(id =>
        boardData.some(t => t.id === id)
    ).length;

    if (completedCount >= TILE_COUNT) {
        showBoardComplete();
    }
}

function showBoardComplete() {
    const boardComplete = document.getElementById('board-complete');
    if (boardComplete) {
        boardComplete.classList.remove('hidden');
        triggerConfetti();
    }
}

// ============================================
// GAME MODAL
// ============================================

function openTile(tileIndex) {
    const tile = boardData[tileIndex];
    if (!tile) return;

    gameState.currentTileIndex = tileIndex;

    // Update modal header
    const missionTitle = document.getElementById('mission-title');
    const missionStars = document.getElementById('mission-stars');

    if (missionTitle) missionTitle.textContent = `Mission #${tile.id}`;
    if (missionStars) missionStars.textContent = '⭐'.repeat(tile.difficulty);

    // Show/hide silly indicator
    if (sillyIndicator) {
        sillyIndicator.classList.toggle('hidden', !tile.isSilly);
    }

    // Load the pre-dealt hand
    renderHand(tile.hand);

    // Show modal
    gameModal.classList.remove('hidden');

    console.log(`📝 Opened tile ${tile.id}: "${tile.hand.hint}" (Silly: ${tile.isSilly})`);
}

function renderHand(hand) {
    sentenceContainer.innerHTML = '';
    bankContainer.innerHTML = '';

    feedbackArea.classList.add('hidden');

    // Shuffle words for the bank
    const shuffled = Dealer.shuffle(hand.words);
    shuffled.forEach(word => {
        const card = createWordCard(word);
        bankContainer.appendChild(card);
    });

    // Store correct answer
    gameState.correctAnswer = hand.correctOrder;
    gameState.currentHint = hand.hint;
}

function closeGameModal() {
    gameModal.classList.add('hidden');
    gameState.currentTileIndex = null;
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

    card.addEventListener('mousedown', handleDragStart);
    card.addEventListener('touchstart', handleDragStart, { passive: false });

    return card;
}

// ============================================
// DRAG AND DROP ENGINE
// ============================================

function handleDragStart(e) {
    e.preventDefault();

    const card = e.target.closest('.word-card');
    if (!card) return;

    gameState.isDragging = true;
    gameState.draggedElement = card;

    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

    const rect = card.getBoundingClientRect();
    gameState.dragOffsetX = clientX - rect.left;
    gameState.dragOffsetY = clientY - rect.top;

    card.classList.add('dragging');
    card.style.position = 'fixed';
    card.style.left = rect.left + 'px';
    card.style.top = rect.top + 'px';
    card.style.width = rect.width + 'px';
    card.style.zIndex = '2000';
    card.style.margin = '0';
}

function handleDragMove(e) {
    if (!gameState.isDragging || !gameState.draggedElement) return;

    e.preventDefault();

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    gameState.draggedElement.style.left = (clientX - gameState.dragOffsetX) + 'px';
    gameState.draggedElement.style.top = (clientY - gameState.dragOffsetY) + 'px';

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

    const cardRect = card.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;

    card.style.position = '';
    card.style.left = '';
    card.style.top = '';
    card.style.width = '';
    card.style.zIndex = '';
    card.style.margin = '';

    const stripRect = sentenceStrip.getBoundingClientRect();

    if (isPointInRect(cardCenterX, cardCenterY, stripRect)) {
        const insertPos = findInsertPosition(cardCenterX);
        const existingCards = Array.from(sentenceContainer.querySelectorAll('.word-card'));
        if (insertPos >= existingCards.length) {
            sentenceContainer.appendChild(card);
        } else {
            sentenceContainer.insertBefore(card, existingCards[insertPos]);
        }
    } else {
        bankContainer.appendChild(card);
    }

    card.classList.add('pop-in');
    setTimeout(() => card.classList.remove('pop-in'), 300);

    gameState.isDragging = false;
    gameState.draggedElement = null;
}

function findInsertPosition(dropX) {
    const existingCards = Array.from(sentenceContainer.querySelectorAll('.word-card'));

    for (let i = 0; i < existingCards.length; i++) {
        const cardRect = existingCards[i].getBoundingClientRect();
        const cardCenterX = cardRect.left + cardRect.width / 2;
        if (dropX < cardCenterX) return i;
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

    let isCorrect = true;
    let errorType = null;

    // Rule A: First word must be capitalized
    if (!sentence[0].isCapitalized) {
        isCorrect = false;
        errorType = 'capitalization';
    }

    // Rule B: Last word must be punctuation
    if (sentence[sentence.length - 1].type !== 'punctuation') {
        isCorrect = false;
        errorType = 'punctuation';
    }

    // Rule C: Word order check
    const userOrder = sentence.map(w => w.id);
    if (userOrder.length !== gameState.correctAnswer.length ||
        !userOrder.every((id, idx) => id === gameState.correctAnswer[idx])) {
        isCorrect = false;
        if (!errorType) errorType = 'order';
    }

    if (isCorrect) {
        handleCorrect();
    } else {
        handleIncorrect(errorType);
    }
}

function handleCorrect() {
    const tile = boardData[gameState.currentTileIndex];

    // Update streak
    gameState.currentStreak++;

    // Calculate points
    const basePoints = tile.difficulty * 10;
    const streakBonus = Math.min(gameState.currentStreak - 1, 5) * 5;
    const points = basePoints + streakBonus;

    // Update user state
    userState.totalScore += points;

    if (!userState.completedTiles.includes(tile.id)) {
        userState.completedTiles.push(tile.id);
    }

    if (gameState.currentStreak > userState.highestStreak) {
        userState.highestStreak = gameState.currentStreak;
    }

    saveUserState();

    // Build sentence text
    const sentenceText = getSentenceFromStrip().map(w => w.text).join(' ');

    // Close game modal and show success
    closeGameModal();
    showSuccessModal(points, sentenceText);

    // Re-render board to show completed tile
    renderBoard();
    updateUI();

    // Speech
    speakSentence(sentenceText);

    // Confetti
    triggerConfetti();
}

function handleIncorrect(errorType) {
    // Reset streak
    gameState.currentStreak = 0;
    updateStreakDisplay();

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
    }

    showFeedback(message, 'error');

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

function resetCurrentTile() {
    const tile = boardData[gameState.currentTileIndex];
    if (tile) {
        renderHand(tile.hand);
    }
}

// ============================================
// SUCCESS MODAL
// ============================================

function showSuccessModal(points, sentence) {
    const successSentence = document.getElementById('success-sentence');
    const successPoints = document.getElementById('success-points');
    const successStreak = document.getElementById('success-streak');

    if (successSentence) successSentence.textContent = `"${sentence}"`;
    if (successPoints) successPoints.textContent = `+${points}`;
    if (successStreak) successStreak.textContent = `🔥 ${gameState.currentStreak}`;

    successModal.classList.remove('hidden');
}

function closeSuccessModal() {
    successModal.classList.add('hidden');
}

// ============================================
// UI UPDATES
// ============================================

function updateUI() {
    // Score
    if (totalScoreEl) totalScoreEl.textContent = userState.totalScore;

    // Progress
    if (progressText) {
        const completed = userState.completedTiles.filter(id =>
            boardData.some(t => t.id === id)
        ).length;
        progressText.textContent = `${completed} / ${TILE_COUNT} Complete`;
    }

    // Update Theme Tag
    if (themeTag && currentTheme) {
        themeTag.textContent = `Theme: ${currentTheme}`;
        // Optional: Change badge color based on theme?
        const colors = {
            'Peppa Pig': '#ffadd6',
            'Bluey': '#8abced',
            'Seaside Holiday': '#4ecdc4',
            'Magical Forest': '#a78bfa',
            'School Life': '#fde047',
            'Family Life': '#fb923c',
            'The Park': '#4ade80',
            'Supermarket': '#f87171'
        };
        // themeTag.style.backgroundColor = colors[currentTheme] || 'rgba(255,255,255,0.2)';
    }

    updateStreakDisplay();
}

function updateStreakDisplay() {
    if (streakValue) {
        streakValue.textContent = gameState.currentStreak;
    }

    const streakDisplay = document.querySelector('.streak-display');

    // Update fire overlay
    if (streakOverlay) {
        streakOverlay.classList.remove('streak-orange', 'streak-blue');
    }
    if (streakDisplay) {
        streakDisplay.classList.remove('on-fire', 'blue-fire');
    }

    if (gameState.currentStreak >= 5) {
        if (streakOverlay) streakOverlay.classList.add('streak-blue');
        if (streakDisplay) streakDisplay.classList.add('blue-fire');
    } else if (gameState.currentStreak >= 3) {
        if (streakOverlay) streakOverlay.classList.add('streak-orange');
        if (streakDisplay) streakDisplay.classList.add('on-fire');
    }
}

// ============================================
// AUDIO
// ============================================

function speakSentence(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-GB';
        utterance.rate = 0.9;

        const voices = speechSynthesis.getVoices();
        const britishVoice = voices.find(v => v.lang === 'en-GB');
        if (britishVoice) utterance.voice = britishVoice;

        speechSynthesis.speak(utterance);
    }
}

// ============================================
// CONFETTI
// ============================================

function resizeConfettiCanvas() {
    if (confettiCanvas) {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }
}

const confettiParticles = [];

function triggerConfetti() {
    for (let i = 0; i < 80; i++) {
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

    if (confettiParticles.length <= 80) {
        animateConfetti();
    }
}

function animateConfetti() {
    if (!confettiCtx) return;

    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    for (let i = confettiParticles.length - 1; i >= 0; i--) {
        const p = confettiParticles[i];

        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        p.speedY += 0.1;

        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate((p.rotation * Math.PI) / 180);
        confettiCtx.fillStyle = p.color;
        confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        confettiCtx.restore();

        if (p.y > confettiCanvas.height + 50) {
            confettiParticles.splice(i, 1);
        }
    }

    if (confettiParticles.length > 0) {
        requestAnimationFrame(animateConfetti);
    }
}
