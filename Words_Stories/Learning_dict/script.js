
document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIG & SETUP ---
    // User Provided Key as fallback default
    const DEFAULT_KEY = "";
    let API_KEY = localStorage.getItem("MAGIC_API_KEY") || DEFAULT_KEY;

    // Elements
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const micBtn = document.getElementById('micBtn');
    const resultContainer = document.getElementById('resultContainer');
    const noResult = document.getElementById('noResult');
    const stickerGrid = document.getElementById('stickerGrid');
    const clearStickersBtn = document.getElementById('clearStickers');
    const settingsBtn = document.getElementById('settingsBtn');

    // Display Elements
    const displayWord = document.getElementById('displayWord');
    const englishMeaning = document.getElementById('englishMeaning');
    const chineseMeaning = document.getElementById('chineseMeaning');
    const simpleExplanation = document.getElementById('simpleExplanation');
    const wordImage = document.getElementById('wordImage');
    const speakEnglishBtn = document.getElementById('speakEnglish');
    const speakChineseBtn = document.getElementById('speakChinese');

    // Modal Elements
    const showCharBtn = document.getElementById('showCharBtn');
    const charModal = document.getElementById('charModal');
    const closeBtn = document.querySelector('.close-btn');
    const largeCharDisplay = document.getElementById('largeCharDisplay');

    let currentWordData = null;
    let mayWords = JSON.parse(localStorage.getItem('mayStickers')) || [];

    // --- 2. AUDIO & SPEECH ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playSuccessSound() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';

        // Simple distinct chime
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5

        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    }

    // Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'en-GB';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            micBtn.classList.add('listening');
        };

        recognition.onend = () => {
            micBtn.classList.remove('listening');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            searchInput.value = transcript.replace(/\.$/, '');
            performSearch();
        };

        micBtn.addEventListener('click', () => {
            if (micBtn.classList.contains('listening')) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    } else {
        micBtn.style.display = 'none'; // Hide if not supported
        console.log("Speech API not supported");
    }


    // --- 3. STICKER BOOK LOGIC ---
    function renderStickers() {
        stickerGrid.innerHTML = '';
        mayWords.forEach((item, index) => {
            const sticker = document.createElement('div');
            sticker.className = 'sticker pop-in';
            sticker.style.animationDelay = `${index * 0.05}s`; // Staggered load
            sticker.innerHTML = `
                <img src="${item.image}" alt="${item.word}">
                <span>${item.word}</span>
            `;
            sticker.onclick = () => {
                searchInput.value = item.word;
                performSearch();
            };
            stickerGrid.appendChild(sticker);
        });
    }

    function addSticker(word, imageUrl) {
        // Prevent duplicates
        if (mayWords.some(w => w.word.toLowerCase() === word.toLowerCase())) return;

        mayWords.unshift({ word: word, image: imageUrl }); // Add to front
        if (mayWords.length > 50) mayWords.pop(); // Limit history

        localStorage.setItem('mayStickers', JSON.stringify(mayWords));
        renderStickers();
    }

    clearStickersBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear your sticker collection?")) {
            mayWords = [];
            localStorage.setItem('mayStickers', JSON.stringify(mayWords));
            renderStickers();
        }
    });

    renderStickers(); // Init load


    // --- 4. CORE SEARCH LOGIC ---
    async function performSearch() {
        if (!API_KEY) {
            promptForKey();
            if (!API_KEY) return;
        }

        const query = searchInput.value.trim().toLowerCase();
        if (!query) return;

        showLoading();

        try {
            // Priority 1: Check Local "Magic" Data (from data.js)
            // Note: data.js defines 'dictionaryData'
            if (typeof dictionaryData !== 'undefined' && dictionaryData[query]) {
                const data = dictionaryData[query];
                displayResult(data);
                addSticker(data.word, data.image);
                playSuccessSound();
                return;
            }

            // Priority 2: OpenAI AI Fetch
            const aiData = await fetchOpenAIData(query);
            if (aiData) {
                displayResult(aiData);
                addSticker(aiData.word, aiData.image);
                playSuccessSound();
            } else {
                showNoResult();
            }

        } catch (error) {
            console.error("Search Error:", error);
            showNoResult();
        } finally {
            hideLoading();
        }
    }

    async function fetchOpenAIData(word) {
        const systemPrompt = `
You are a magical dictionary for a 6-year-old girl named May.
Input: A word.
Output: Valid JSON only. format:
{
  "word": "Capitalized Word",
  "englishMeaning": "Simple, child-friendly definition (1 sentence).",
  "chineseMeaning": "Chinese Translation (Pinyin)",
  "chineseChar": "The main Chinese character(s)",
  "explanation": "A fun fact or simple example sentence.",
  "imagePrompt": "A cute, simple, 3D cartoon style illustration description of the word, suitable for children."
}
If the word is widely known, return the JSON.
If the word is inappropriate or nonsense, return null.
        `;

        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini", // or gpt-3.5-turbo if preferred for cost
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: `Define: "${word}"` }
                    ],
                    max_tokens: 200,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    alert("API Key invalid! Check settings.");
                    return null;
                }
                throw new Error("API Request failed");
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            if (!content || content.toLowerCase().includes("null")) return null;

            // Parse JSOn safely
            let parsed = null;
            try {
                // Determine if constrained by ```json blocks
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    parsed = JSON.parse(jsonMatch[0]);
                } else {
                    parsed = JSON.parse(content);
                }
            } catch (e) {
                console.error("JSON Parse error", e);
                return null;
            }

            // Generate Image Link using Pollinations (fast, free)
            const safePrompt = encodeURIComponent(parsed.imagePrompt);
            const imageUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=600&height=600&nologo=true&seed=${Math.random()}`;

            return {
                word: parsed.word,
                englishMeaning: parsed.englishMeaning,
                chineseMeaning: parsed.chineseMeaning,
                chineseChar: parsed.chineseChar,
                explanation: parsed.explanation,
                image: imageUrl,
                chinesePronunciation: parsed.chineseChar // simplified
            };

        } catch (e) {
            console.error("AI Fetch Error", e);
            return null;
        }
    }


    // --- 5. UI HELPERS ---
    function displayResult(data) {
        currentWordData = data;

        displayWord.textContent = data.word;
        englishMeaning.textContent = data.englishMeaning;
        chineseMeaning.textContent = data.chineseMeaning;
        simpleExplanation.textContent = data.explanation;
        wordImage.src = data.image;

        // Large Char Logic
        const mainChar = data.chineseChar || "?";
        largeCharDisplay.textContent = mainChar;

        // Font sizing
        if (mainChar.length > 3) largeCharDisplay.style.fontSize = '3rem';
        else if (mainChar.length === 3) largeCharDisplay.style.fontSize = '4.5rem';
        else largeCharDisplay.style.fontSize = '8rem';

        wordImage.onerror = () => {
            wordImage.src = 'https://via.placeholder.com/400x300?text=Magic+Image+Pending...';
        };

        resultContainer.classList.remove('hidden');
        noResult.classList.add('hidden');

        // --- ANIMATIONS ---
        const cards = resultContainer.querySelectorAll('.word-card, .explanation-card, .image-card');

        // 1. Reset
        cards.forEach(card => {
            card.classList.remove('slide-in-up', 'delay-1', 'delay-2', 'delay-3');
            void card.offsetWidth; // Trigger Reflow
        });

        // 2. Add Classes
        const cardArray = Array.from(cards);
        if (cardArray[0]) cardArray[0].classList.add('slide-in-up');
        if (cardArray[1]) cardArray[1].classList.add('slide-in-up', 'delay-1');
        if (cardArray[2]) cardArray[2].classList.add('slide-in-up', 'delay-2');

        fireConfetti();
    }

    function showNoResult() {
        resultContainer.classList.add('hidden');
        noResult.classList.remove('hidden');
    }

    function showLoading() {
        noResult.classList.add('hidden');
        resultContainer.classList.add('hidden');
        searchBtn.textContent = "✨ Magic...";
        searchBtn.disabled = true;
    }

    function hideLoading() {
        searchBtn.textContent = "Go!";
        searchBtn.disabled = false;
    }

    function promptForKey() {
        const newKey = prompt("Please enter your Magic AI Key (OpenAI):", API_KEY);
        if (newKey && newKey.trim() !== "") {
            API_KEY = newKey.trim();
            localStorage.setItem("MAGIC_API_KEY", API_KEY);
            alert("Key Saved! Try searching again.");
        }
    }

    // --- 6. EVENT LISTENERS ---
    searchBtn.addEventListener('click', performSearch);

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    settingsBtn.addEventListener('click', promptForKey);

    // TTS
    speakEnglishBtn.addEventListener('click', () => {
        if (!currentWordData) return;
        const u = new SpeechSynthesisUtterance(currentWordData.word);
        u.lang = 'en-GB';
        window.speechSynthesis.speak(u);
    });

    speakChineseBtn.addEventListener('click', () => {
        if (!currentWordData) return;
        // Text is often "苹果 (Píngguǒ)", strict chinese synth might read pinyin nicely or awkwardly.
        // Let's try to just read the chars if available, or the full string.
        const u = new SpeechSynthesisUtterance(currentWordData.chineseMeaning);
        u.lang = 'zh-CN';
        window.speechSynthesis.speak(u);
    });

    // Modal
    showCharBtn.addEventListener('click', () => charModal.classList.remove('hidden'));
    closeBtn.addEventListener('click', () => charModal.classList.add('hidden'));
    window.addEventListener('click', (e) => {
        if (e.target === charModal) charModal.classList.add('hidden');
    });

});

function fireConfetti() {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF8E53', '#FFFFFF'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        const el = document.createElement('div');
        el.classList.add('confetti-particle');
        document.body.appendChild(el);

        // Random start position near center/top
        const xStr = (50 + (Math.random() - 0.5) * 10) + 'vw';
        const yStr = (40 + (Math.random() - 0.5) * 10) + 'vh';

        el.style.left = xStr;
        el.style.top = yStr;
        el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        // Animate
        const angle = Math.random() * 2 * Math.PI;
        const velocity = 200 + Math.random() * 200;
        const xEnd = Math.cos(angle) * velocity;
        const yEnd = Math.sin(angle) * velocity;

        const animation = el.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${xEnd}px, ${yEnd}px) scale(0)`, opacity: 0 }
        ], {
            duration: 1000 + Math.random() * 500,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
        });

        animation.onfinish = () => el.remove();
    }
}
