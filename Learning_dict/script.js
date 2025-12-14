document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultContainer = document.getElementById('resultContainer');
    const noResult = document.getElementById('noResult');

    // Elements to populate
    const displayWord = document.getElementById('displayWord');
    const englishMeaning = document.getElementById('englishMeaning');
    const chineseMeaning = document.getElementById('chineseMeaning');
    const simpleExplanation = document.getElementById('simpleExplanation');
    const wordImage = document.getElementById('wordImage');

    // Buttons
    const speakEnglishBtn = document.getElementById('speakEnglish');
    const speakChineseBtn = document.getElementById('speakChinese');
    const showCharBtn = document.getElementById('showCharBtn');

    // Modal
    const charModal = document.getElementById('charModal');
    const closeBtn = document.querySelector('.close-btn');
    const largeCharDisplay = document.getElementById('largeCharDisplay');

    let currentWordData = null;

    // Search Function
    async function performSearch() {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) return;

        // 1. Check Local "Magic" Dictionary first
        if (dictionaryData[query]) {
            displayResult(dictionaryData[query]);
            return;
        }

        // 2. If not found, fetch from the Internet
        showLoading();
        try {
            const onlineData = await fetchOnlineData(query);
            if (onlineData) {
                displayResult(onlineData);
            } else {
                showNoResult();
            }
        } catch (error) {
            console.error("Search failed:", error);
            showNoResult();
        } finally {
            hideLoading();
        }
    }

    async function fetchOnlineData(word) {
        try {
            // A. Fetch English Definition
            const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            if (!dictRes.ok) return null;
            const dictData = await dictRes.json();

            // Extract first definition
            const meaningObj = dictData[0].meanings[0]; // usually noun or verb
            const definition = meaningObj.definitions[0].definition;
            const partOfSpeech = meaningObj.partOfSpeech;

            // B. Fetch Chinese Translation
            const transRes = await fetch(`https://api.mymemory.translated.net/get?q=${word}&langpair=en|zh`);
            const transData = await transRes.json();
            const chineseText = transData.responseData.translatedText;

            // Extract all Chinese characters for the popup
            const chineseChars = chineseText.match(/[\u4e00-\u9fa5]+/g);
            const mainChar = chineseChars ? chineseChars.join('') : "?";

            // C. Generate/Fetch Image
            // Using Pollinations.ai for a generated kid-friendly image
            const imageUrl = `https://image.pollinations.ai/prompt/cute%20cartoon%20illustration%20of%20${word}?width=800&height=600&nologo=true&seed=${Math.random()}`;

            // Generate Fun Fact (Example or Synonym)
            const entry = dictData[0];
            let funFact = `The word "${entry.word}" has ${entry.word.length} letters!`;
            let foundFact = false;

            if (entry.meanings) {
                for (const meaning of entry.meanings) {
                    for (const def of meaning.definitions) {
                        if (def.example) {
                            funFact = `You can use it in a sentence like this: "${def.example}"`;
                            foundFact = true;
                            break;
                        }
                    }
                    if (foundFact) break;
                }
            }

            if (!foundFact && entry.meanings) {
                for (const meaning of entry.meanings) {
                    if (meaning.synonyms && meaning.synonyms.length > 0) {
                        funFact = `Another word for this is "${meaning.synonyms[0]}".`;
                        foundFact = true;
                        break;
                    }
                    for (const def of meaning.definitions) {
                        if (def.synonyms && def.synonyms.length > 0) {
                            funFact = `Another word for this is "${def.synonyms[0]}".`;
                            foundFact = true;
                            break;
                        }
                    }
                    if (foundFact) break;
                }
            }

            return {
                word: dictData[0].word, // Use the capitalized version from API if available, or just the input
                englishMeaning: definition,
                chineseMeaning: chineseText,
                chineseChar: mainChar,
                explanation: funFact,
                image: imageUrl,
                chinesePronunciation: chineseText
            };

        } catch (e) {
            console.error("Error fetching data:", e);
            return null;
        }
    }

    function displayResult(data) {
        currentWordData = data;

        // Capitalize word for display
        displayWord.textContent = data.word.charAt(0).toUpperCase() + data.word.slice(1);
        englishMeaning.textContent = data.englishMeaning;
        chineseMeaning.textContent = data.chineseMeaning;
        simpleExplanation.textContent = data.explanation;
        wordImage.src = data.image;

        // Determine what to show in the large display
        // Try to extract just the Chinese characters from the meaning string (handles "Word (Pinyin)" format)
        const chineseMatches = data.chineseMeaning.match(/[\u4e00-\u9fa5]+/g);
        const fullChineseWord = chineseMatches ? chineseMatches.join('') : (data.chineseChar || "?");

        largeCharDisplay.textContent = fullChineseWord;

        // Dynamic Font Size based on length
        if (fullChineseWord.length > 3) {
            largeCharDisplay.style.fontSize = '3rem';
        } else if (fullChineseWord.length === 3) {
            largeCharDisplay.style.fontSize = '4.5rem';
        } else if (fullChineseWord.length === 2) {
            largeCharDisplay.style.fontSize = '6rem';
        } else {
            largeCharDisplay.style.fontSize = '8rem';
        }

        // Handle image loading errors
        wordImage.onerror = () => {
            wordImage.src = 'https://via.placeholder.com/400x300?text=No+Image+Found';
        };

        resultContainer.classList.remove('hidden');
        noResult.classList.add('hidden');
    }

    function showNoResult() {
        resultContainer.classList.add('hidden');
        noResult.classList.remove('hidden');
    }

    function showLoading() {
        noResult.classList.add('hidden');
        resultContainer.classList.add('hidden');
        searchBtn.textContent = "Searching...";
        searchBtn.disabled = true;
    }

    function hideLoading() {
        searchBtn.textContent = "Go!";
        searchBtn.disabled = false;
    }

    // Event Listeners
    searchBtn.addEventListener('click', performSearch);

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Text to Speech - English
    speakEnglishBtn.addEventListener('click', () => {
        if (!currentWordData) return;
        const utterance = new SpeechSynthesisUtterance(currentWordData.word);
        utterance.lang = 'en-GB';
        window.speechSynthesis.speak(utterance);
    });

    // Text to Speech - Chinese
    speakChineseBtn.addEventListener('click', () => {
        if (!currentWordData) return;
        // Try to speak just the Chinese characters if possible, or the full string
        const textToSpeak = currentWordData.chinesePronunciation || currentWordData.chineseMeaning;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'zh-CN';
        window.speechSynthesis.speak(utterance);
    });

    // Modal Logic
    showCharBtn.addEventListener('click', () => {
        charModal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
        charModal.classList.add('hidden');
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === charModal) {
            charModal.classList.add('hidden');
        }
    });
});
