(() => {
    'use strict';

    // Matches a gentle England-primary progression: 2, 5, 10, then 3, 4, 8, 6, 7, 9.
    const FAMILY_ORDER = [2, 5, 10, 3, 4, 8, 6, 7, 9];
    const FACTORS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const PASS_TARGET = 3;
    const STORAGE_KEY = 'magic-learning-fact-family-v3';

    const SKILLS = [
        { id: 'multiplyForward', label: 'Times it forwards' },
        { id: 'multiplyReverse', label: 'Turn it around' },
        { id: 'missingProduct', label: 'Find the product' },
        { id: 'missingFactorA', label: 'Find the first number' },
        { id: 'missingFactorB', label: 'Find the second number' },
        { id: 'divideByA', label: 'Division fact one' },
        { id: 'divideByB', label: 'Division fact two' }
    ];
    const MULTIPLICATION_LAYER = ['multiplyForward', 'multiplyReverse', 'missingProduct'];
    const MISSING_NUMBER_LAYER = ['missingFactorA', 'missingFactorB'];
    const DIVISION_LAYER = ['divideByA', 'divideByB'];

    const els = {
        familyTrack: document.getElementById('family-track'),
        progressGrid: document.getElementById('progress-grid'),
        nextUnlockTitle: document.getElementById('next-unlock-title'),
        nextUnlockCopy: document.getElementById('next-unlock-copy'),
        nextUnlockLayers: document.getElementById('next-unlock-layers'),
        lessonTitle: document.getElementById('lesson-title'),
        checklistTitle: document.getElementById('checklist-title'),
        checklist: document.getElementById('checklist'),
        checklistScore: document.getElementById('checklist-score'),
        sessionCount: document.getElementById('session-count'),
        certificationLabel: document.getElementById('certification-label'),
        certificationBar: document.getElementById('certification-bar'),
        triangleProduct: document.getElementById('triangle-product'),
        triangleLeft: document.getElementById('triangle-left'),
        triangleRight: document.getElementById('triangle-right'),
        factPreview: document.getElementById('fact-preview'),
        questionKind: document.getElementById('question-kind'),
        questionText: document.getElementById('question-text'),
        hintMessage: document.getElementById('hint-message'),
        answers: document.getElementById('answers'),
        feedback: document.getElementById('feedback'),
        startButton: document.getElementById('start-button'),
        hintButton: document.getElementById('hint-button'),
        helpButton: document.getElementById('help-button'),
        skipButton: document.getElementById('skip-button'),
        nextButton: document.getElementById('next-button'),
        cheatsheetButton: document.getElementById('cheatsheet-button'),
        studyModal: document.getElementById('study-modal'),
        closeStudy: document.getElementById('close-study'),
        studyTablePicker: document.getElementById('study-table-picker'),
        studyFamilyTitle: document.getElementById('study-family-title'),
        studySeen: document.getElementById('study-seen'),
        studyEquations: document.getElementById('study-equations'),
        studyFamilyPreview: document.getElementById('study-family-preview'),
        studyHelper: document.getElementById('study-helper'),
        studyReadyButton: document.getElementById('study-ready-button'),
        sessionModal: document.getElementById('session-modal'),
        sessionCopy: document.getElementById('session-copy'),
        finishSession: document.getElementById('finish-session'),
        continueSession: document.getElementById('continue-session'),
        resetProgress: document.getElementById('reset-progress'),
        toast: document.getElementById('toast')
    };

    let state = loadState();
    let activeFamilyIndex = firstIncompleteFamily();
    let currentQuestion = null;
    let questionAnswered = false;
    let hintLevel = 0;
    let sessionAnswered = 0;
    let sessionCorrect = 0;
    let practiceMode = 'certification';
    let warmupRemaining = 0;
    let warmupCorrect = 0;
    let selectedStudyTable = FAMILY_ORDER[activeFamilyIndex];
    let selectedStudyFactKey = null;
    let lastQuestionSignature = null;
    let sessionBreakOffered = false;
    let toastTimer = null;

    function factKey(a, b) { return `${Math.min(a, b)}x${Math.max(a, b)}`; }

    function factFor(table, factor) {
        return { a: table, b: factor, product: table * factor, key: factKey(table, factor) };
    }

    function familyFacts(table) { return FACTORS.map((factor) => factFor(table, factor)); }

    function emptyCertification() {
        const certification = {};
        FAMILY_ORDER.forEach((table) => {
            certification[table] = {};
            familyFacts(table).forEach((fact) => {
                certification[table][fact.key] = {};
                SKILLS.forEach((skill) => { certification[table][fact.key][skill.id] = 0; });
            });
        });
        return certification;
    }

    function emptyFacts() {
        const facts = {};
        for (let a = 2; a <= 10; a += 1) {
            for (let b = a; b <= 12; b += 1) {
                facts[factKey(a, b)] = { attempts: 0, correct: 0, hints: 0, lastSeen: null };
            }
        }
        return facts;
    }

    function defaultState() {
        const study = {};
        FAMILY_ORDER.forEach((table) => { study[table] = { seen: [], ready: false }; });
        return { version: 1, highestUnlocked: 0, certification: emptyCertification(), facts: emptyFacts(), study };
    }

    function loadState() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (saved && saved.version === 1 && saved.certification && saved.facts) {
                if (!saved.study) {
                    saved.study = {};
                    FAMILY_ORDER.forEach((table) => { saved.study[table] = { seen: [], ready: false }; });
                }
                FAMILY_ORDER.forEach((table) => {
                    if (!saved.study[table]) saved.study[table] = { seen: [], ready: false };
                    if (!saved.certification[table]) saved.certification[table] = {};
                    familyFacts(table).forEach((fact) => {
                        if (!saved.certification[table][fact.key]) saved.certification[table][fact.key] = {};
                        SKILLS.forEach((skill) => {
                            if (typeof saved.certification[table][fact.key][skill.id] !== 'number') saved.certification[table][fact.key][skill.id] = 0;
                        });
                    });
                });
                Object.keys(emptyFacts()).forEach((key) => {
                    if (!saved.facts[key]) saved.facts[key] = { attempts: 0, correct: 0, hints: 0, lastSeen: null };
                });
                return saved;
            }
        } catch (error) { console.warn('Unable to load saved progress', error); }
        return defaultState();
    }

    function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

    function firstIncompleteFamily() {
        const index = FAMILY_ORDER.findIndex((table) => !isFamilyCertified(table));
        return index === -1 ? FAMILY_ORDER.length - 1 : index;
    }

    function familyProgress(table) {
        let completed = 0;
        const total = familyFacts(table).length * SKILLS.length * PASS_TARGET;
        familyFacts(table).forEach((fact) => SKILLS.forEach((skill) => {
            completed += Math.min(state.certification[table][fact.key][skill.id], PASS_TARGET);
        }));
        return { completed, total, percent: Math.round((completed / total) * 100) };
    }

    function isFamilyCertified(table) { return familyProgress(table).completed === familyProgress(table).total; }

    function isFamilyUnlocked(index) { return index <= state.highestUnlocked; }

    function studyRecord(table) {
        if (!state.study[table]) state.study[table] = { seen: [], ready: false };
        return state.study[table];
    }

    function isStudyComplete(table) { return familyFacts(table).every((fact) => studyRecord(table).seen.includes(fact.key)); }

    function renderStudyPicker() {
        els.studyTablePicker.innerHTML = '';
        FAMILY_ORDER.forEach((table) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `study-table-button${selectedStudyTable === table ? ' active' : ''}`;
            button.textContent = `×${table}`;
            button.addEventListener('click', () => {
                selectedStudyTable = table;
                selectedStudyFactKey = null;
                renderStudyContent();
            });
            els.studyTablePicker.appendChild(button);
        });
    }

    function selectStudyFact(index) {
        const facts = familyFacts(selectedStudyTable);
        const fact = facts[index];
        if (!fact) return;
        selectedStudyFactKey = fact.key;
        const record = studyRecord(selectedStudyTable);
        if (!record.seen.includes(fact.key)) {
            record.seen.push(fact.key);
            saveState();
        }
        renderStudyContent();
        els.studyFamilyPreview.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function renderStudyDetail(fact, index, total) {
        const groupDots = Array.from({ length: fact.b }, () =>
            `<span class="study-group" aria-hidden="true">${'<i></i>'.repeat(fact.a)}</span>`
        ).join('');
        const secondDivision = fact.a === fact.b ? '' : `<strong>${fact.product} ÷ ${fact.b} = ${fact.a}</strong>`;
        els.studyFamilyPreview.innerHTML = `
            <p class="eyebrow">One fact family</p>
            <p class="study-detail-lead">${fact.b} groups of ${fact.a} make <strong>${fact.product}</strong></p>
            <div class="study-groups" aria-label="${fact.b} groups of ${fact.a}">${groupDots}</div>
            <div class="study-main-equation">${fact.a} × ${fact.b} <span>=</span> ${fact.product}</div>
            <div class="study-related-facts">
                <div><small>Turn it around</small><strong>${fact.b} × ${fact.a} = ${fact.product}</strong></div>
                <div><small>Share it back</small><strong>${fact.product} ÷ ${fact.a} = ${fact.b}</strong>${secondDivision}</div>
            </div>
            <div class="study-fact-nav">
                <button type="button" data-study-index="${index - 1}" ${index === 0 ? 'disabled' : ''}>← Previous fact</button>
                <span>${index + 1} of ${total}</span>
                <button type="button" data-study-index="${index + 1}" ${index === total - 1 ? 'disabled' : ''}>Next fact →</button>
            </div>`;
    }

    function renderStudyContent() {
        const table = selectedStudyTable;
        const record = studyRecord(table);
        const facts = familyFacts(table);
        const selectedIndex = facts.findIndex((fact) => fact.key === selectedStudyFactKey);
        const isCurrent = table === FAMILY_ORDER[activeFamilyIndex];
        const seenCount = facts.filter((fact) => record.seen.includes(fact.key)).length;
        els.studyFamilyTitle.textContent = `×${table} Family`;
        els.studySeen.textContent = `${seenCount} / ${facts.length} explored`;
        els.studyEquations.innerHTML = '';
        facts.forEach((fact, index) => {
            const button = document.createElement('button');
            const seen = record.seen.includes(fact.key);
            button.type = 'button';
            button.className = `study-equation${seen ? ' seen' : ''}${index === selectedIndex ? ' active' : ''}`;
            button.setAttribute('aria-pressed', index === selectedIndex ? 'true' : 'false');
            button.innerHTML = `<strong>${fact.a} × ${fact.b} <span>= ${fact.product}</span></strong><span class="seen-mark" aria-label="${seen ? 'Explored' : 'Not explored'}">${seen ? '✓' : '○'}</span>`;
            button.addEventListener('click', () => selectStudyFact(index));
            els.studyEquations.appendChild(button);
        });
        if (selectedIndex === -1) {
            els.studyFamilyPreview.innerHTML = '<p class="study-placeholder">Tap a fact to explore its groups and linked division facts.</p>';
        } else {
            renderStudyDetail(facts[selectedIndex], selectedIndex, facts.length);
        }
        els.studyReadyButton.disabled = !isCurrent || !isStudyComplete(table);
        if (!isCurrent) {
            els.studyHelper.textContent = 'This table is for looking up now. Practice unlocks later.';
        } else if (!isStudyComplete(table)) {
            els.studyHelper.textContent = 'Tap each fact once to explore it. Explored means seen, not mastered.';
        } else {
            els.studyHelper.textContent = 'You have explored this table. Three gentle warm-ups come before the real challenge.';
        }
        renderStudyPicker();
    }

    function openStudy(table = FAMILY_ORDER[activeFamilyIndex]) {
        selectedStudyTable = table;
        selectedStudyFactKey = null;
        els.studyModal.classList.remove('hidden');
        renderStudyContent();
    }

    function closeStudy() { els.studyModal.classList.add('hidden'); }

    function beginWarmup() {
        const table = FAMILY_ORDER[activeFamilyIndex];
        practiceMode = 'warmup';
        warmupRemaining = 3;
        warmupCorrect = 0;
        currentQuestion = null;
        beginWarmupQuestion(table);
    }

    function beginWarmupQuestion(table) {
        const previousFactKey = lastQuestionSignature ? lastQuestionSignature.split(':')[1] : null;
        const freshFacts = familyFacts(table).filter((candidate) => candidate.key !== previousFactKey);
        const factPool = freshFacts.length ? freshFacts : familyFacts(table);
        const fact = factPool[Math.floor(Math.random() * factPool.length)];
        let skillId = 'multiplyForward';
        if (warmupRemaining === 2) skillId = 'multiplyReverse';
        if (warmupRemaining === 1 && warmupCorrect >= 2) skillId = 'missingFactorB';
        const skill = SKILLS.find((candidate) => candidate.id === skillId);
        currentQuestion = { fact, skill, table, warmup: true };
        lastQuestionSignature = `${table}:${fact.key}:${skill.id}`;
        questionAnswered = false;
        hintLevel = 0;
        els.feedback.textContent = '';
        els.feedback.className = 'feedback';
        els.hintButton.classList.add('hidden');
        els.helpButton.classList.remove('hidden');
        els.skipButton.classList.remove('hidden');
        els.nextButton.classList.add('hidden');
        els.nextButton.textContent = 'Next warm-up';
        els.startButton.classList.add('hidden');
        renderQuestion(currentQuestion);
        els.questionKind.textContent = `Warm-up · ${skill.label}`;
    }

    function render() {
        const table = FAMILY_ORDER[activeFamilyIndex];
        const progress = familyProgress(table);
        els.lessonTitle.textContent = `×${table} Family`;
        els.checklistTitle.textContent = `×${table} Family`;
        els.certificationLabel.textContent = progress.percent === 100 ? 'Ready to unlock!' : progress.percent === 0 ? 'Just starting' : 'Growing';
        els.certificationBar.style.width = `${progress.percent}%`;
        els.checklistScore.textContent = progress.percent === 100 ? 'Strong' : progress.percent === 0 ? 'Starting' : 'Growing';
        renderFamilyTrack();
        renderProgressGrid();
        renderNextUnlock(table);
        renderChecklist(table);
        if (!currentQuestion) {
            updateIdleQuestion(table);
            if (!isFamilyCertified(table)) {
                els.startButton.textContent = !isStudyComplete(table) ? `Learn ×${table} first` : studyRecord(table).ready ? 'Continue challenge' : 'Start warm-up';
            }
        }
        if (!els.studyModal.classList.contains('hidden')) renderStudyContent();
    }

    function renderFamilyTrack() {
        els.familyTrack.innerHTML = '';
        FAMILY_ORDER.forEach((table, index) => {
            const button = document.createElement('button');
            const certified = isFamilyCertified(table);
            const unlocked = isFamilyUnlocked(index);
            button.type = 'button';
            button.className = `family-node${index === activeFamilyIndex ? ' active' : ''}${certified ? ' certified' : ''}${!unlocked ? ' locked' : ''}`;
            button.disabled = !unlocked;
            button.innerHTML = `<span class="node-icon">${certified ? '✓' : unlocked ? '🔓' : '🔒'}</span><span class="node-label">×${table}</span><span class="node-status">${certified ? 'Strong' : unlocked ? 'Learning' : 'Locked'}</span>`;
            button.addEventListener('click', () => {
                if (activeFamilyIndex === index) return;
                activeFamilyIndex = index;
                resetPracticeView();
                render();
            });
            els.familyTrack.appendChild(button);
        });
    }

    function renderProgressGrid() {
        els.progressGrid.innerHTML = '';
        FAMILY_ORDER.forEach((table, index) => {
            const cell = document.createElement('div');
            const certified = isFamilyCertified(table);
            const unlocked = isFamilyUnlocked(index);
            const progress = familyProgress(table);
            cell.className = `grid-cell${index === activeFamilyIndex ? ' active' : ''}${certified ? ' certified' : ''}`;
            cell.innerHTML = `<span class="grid-icon">${certified ? '🌟' : unlocked ? '🌱' : '☁️'}</span><strong>×${table}</strong><small>${certified ? 'Strong' : unlocked ? 'Learning' : 'Locked'}</small>`;
            els.progressGrid.appendChild(cell);
        });
    }

    function layerHasStarted(table, skillIds) {
        return familyFacts(table).some((fact) => skillIds.some((skillId) => state.certification[table][fact.key][skillId] > 0));
    }

    function layerStatus(table, skillIds, previousIds = null) {
        if (skillLayerComplete(table, skillIds)) return 'Strong';
        if (previousIds && skillLayerComplete(table, previousIds)) return 'Ready next';
        return layerHasStarted(table, skillIds) ? 'Growing' : 'Waiting';
    }

    function renderNextUnlock(table) {
        const index = FAMILY_ORDER.indexOf(table);
        const nextTable = FAMILY_ORDER[index + 1];
        if (nextTable) {
            els.nextUnlockTitle.textContent = isFamilyCertified(table) ? `×${table} is strong — next is ×${nextTable}` : `Make ×${table} strong to open ×${nextTable}`;
            els.nextUnlockCopy.textContent = activeFamilyIndex > 0
                ? `Multiplication → missing numbers → division. Earlier tables return as gentle memory bridges while you learn this one.`
                : `Multiplication → missing numbers → division. Earlier tables will return as gentle memory bridges.`;
        } else {
            els.nextUnlockTitle.textContent = isFamilyCertified(table) ? 'The whole trail is open' : `Make ×${table} strong to finish the trail`;
            els.nextUnlockCopy.textContent = 'Three independent stars make each skill strong. You can keep practising any table whenever you like.';
        }
        const layers = [
            ['Multiplication', layerStatus(table, MULTIPLICATION_LAYER)],
            ['Missing numbers', layerStatus(table, MISSING_NUMBER_LAYER, MULTIPLICATION_LAYER)],
            ['Division', layerStatus(table, DIVISION_LAYER, MISSING_NUMBER_LAYER)]
        ];
        els.nextUnlockLayers.innerHTML = layers.map(([label, status]) => `<span class="layer-pill ${status.toLowerCase().replace(' ', '-')}"><strong>${label}</strong><small>${status}</small></span>`).join('');
    }

    function renderChecklist(table) {
        const rows = [];
        const facts = familyFacts(table);
        SKILLS.forEach((skill) => {
            let passed = 0;
            facts.forEach((fact) => { passed += state.certification[table][fact.key][skill.id]; });
            const total = facts.length * PASS_TARGET;
            const done = passed === total;
            const dots = Math.min(PASS_TARGET, Math.floor(passed / facts.length));
            const progressDots = `${'●'.repeat(dots)}${'○'.repeat(PASS_TARGET - dots)}`;
            const status = done ? 'Strong' : dots > 0 ? 'Growing' : 'Next';
            rows.push(`<div class="check-row${done ? ' done' : ''}"><span class="check-dot">${done ? '✓' : '•'}</span><span>${skill.label}</span><span class="check-passes" aria-label="${status}">${progressDots}</span></div>`);
        });
        els.checklist.innerHTML = rows.join('');
    }

    function updateIdleQuestion(table) {
        const progress = familyProgress(table);
        els.sessionCount.textContent = `${sessionCorrect} little wins`;
        els.questionKind.textContent = progress.percent === 100 ? 'Table complete' : isStudyComplete(table) ? 'Ready for a warm-up' : 'Ready to learn';
        els.questionText.textContent = progress.percent === 100 ? `×${table} is feeling strong!` : isStudyComplete(table) ? `Warm up ×${table}` : `Let’s learn ×${table}`;
        els.hintMessage.textContent = progress.percent === 100 ? 'You can keep practising, or take a well-earned break.' : isStudyComplete(table) ? 'Three easy-going questions will help you get into the flow.' : 'Explore the times-table book before you start practising.';
        const sample = familyFacts(table)[0];
        updateTriangle(sample, null);
        els.answers.innerHTML = '';
    }

    function updateTriangle(fact, missing) {
        els.triangleProduct.textContent = missing === 'product' ? '?' : fact.product;
        els.triangleLeft.textContent = missing === 'left' ? '?' : fact.a;
        els.triangleRight.textContent = missing === 'right' ? '?' : fact.b;
        els.factPreview.innerHTML = `<span>${fact.a}</span><b>—</b><span>${fact.b}</span><b>—</b><span>${fact.product}</span>`;
    }

    function getIncompleteItems(table) {
        const items = [];
        const activeSkillIds = getActiveSkillIds(table);
        familyFacts(table).forEach((fact) => SKILLS.filter((skill) => activeSkillIds.includes(skill.id)).forEach((skill) => {
            const passes = state.certification[table][fact.key][skill.id];
            if (passes < PASS_TARGET) items.push({ fact, skill, passes });
        }));
        return items;
    }

    function skillLayerComplete(table, skillIds) {
        return familyFacts(table).every((fact) => skillIds.every((skillId) => state.certification[table][fact.key][skillId] > 0));
    }

    function getActiveSkillIds(table) {
        if (!skillLayerComplete(table, MULTIPLICATION_LAYER)) return MULTIPLICATION_LAYER;
        if (!skillLayerComplete(table, MISSING_NUMBER_LAYER)) return [...MULTIPLICATION_LAYER, ...MISSING_NUMBER_LAYER];
        return SKILLS.map((skill) => skill.id);
    }

    function chooseItem(table) {
        const items = getIncompleteItems(table);
        if (!items.length) return null;
        items.forEach((item) => { item.table = table; });
        const minPasses = Math.min(...items.map((item) => item.passes));
        const tier = items.filter((item) => item.passes === minPasses);
        const freshTier = tier.filter((item) => `${item.table}:${item.fact.key}:${item.skill.id}` !== lastQuestionSignature);
        const pool = freshTier.length ? freshTier : tier;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function getReviewItems() {
        const items = [];
        for (let index = 0; index < activeFamilyIndex; index += 1) {
            const table = FAMILY_ORDER[index];
            if (!isFamilyCertified(table)) continue;
            familyFacts(table).forEach((fact) => {
                [...MULTIPLICATION_LAYER, 'missingFactorB', ...DIVISION_LAYER].forEach((skillId) => {
                    const skill = SKILLS.find((candidate) => candidate.id === skillId);
                    items.push({ fact, skill, table, review: true, passes: state.certification[table][fact.key][skillId] });
                });
            });
        }
        return items;
    }

    function chooseSessionItem(table) {
        if (activeFamilyIndex > 0 && Math.random() < 0.2) {
            const reviewItems = getReviewItems();
            const freshReviews = reviewItems.filter((item) => `${item.table}:${item.fact.key}:${item.skill.id}` !== lastQuestionSignature);
            if (freshReviews.length) return freshReviews[Math.floor(Math.random() * freshReviews.length)];
        }
        return chooseItem(table);
    }

    function beginQuestion() {
        const table = FAMILY_ORDER[activeFamilyIndex];
        practiceMode = 'certification';
        currentQuestion = chooseSessionItem(table);
        if (!currentQuestion) { completeFamily(table); return; }
        lastQuestionSignature = `${currentQuestion.table}:${currentQuestion.fact.key}:${currentQuestion.skill.id}`;
        questionAnswered = false;
        hintLevel = 0;
        els.feedback.textContent = '';
        els.feedback.className = 'feedback';
        els.hintButton.classList.add('hidden');
        els.helpButton.classList.remove('hidden');
        els.skipButton.classList.remove('hidden');
        els.nextButton.classList.add('hidden');
        els.startButton.classList.add('hidden');
        renderQuestion(currentQuestion);
        render();
    }

    function renderQuestion(item) {
        const { fact, skill } = item;
        const question = createQuestion(fact, skill.id);
        currentQuestion.question = question;
        els.questionKind.textContent = item.review ? `Memory bridge · ${skill.label}` : skill.label;
        els.questionText.textContent = question.text;
        els.hintMessage.textContent = item.review ? 'A gentle revisit from an earlier table.' : 'Have a think. If you need a hand, the button will show the first step.';
        els.helpButton.textContent = skill.id.startsWith('divide') ? 'Turn it into multiplication' : skill.id.startsWith('missingFactor') ? 'Show me the family' : 'Show me the first step';
        updateTriangle(fact, question.missing);
        els.answers.innerHTML = '';
        createChoices(question.answer, fact).forEach((choice) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'answer-button';
            button.textContent = choice;
            button.addEventListener('click', () => answerQuestion(choice, button));
            els.answers.appendChild(button);
        });
    }

    function createQuestion(fact, skillId) {
        const { a, b, product } = fact;
        const questions = {
            multiplyForward: { text: `${a} × ${b} = ?`, answer: product, missing: 'product' },
            multiplyReverse: { text: `${b} × ${a} = ?`, answer: product, missing: 'product' },
            missingProduct: { text: `${a} × ${b} = ?`, answer: product, missing: 'product' },
            missingFactorA: { text: `? × ${b} = ${product}`, answer: a, missing: 'left' },
            missingFactorB: { text: `${a} × ? = ${product}`, answer: b, missing: 'right' },
            divideByA: { text: `${product} ÷ ${a} = ?`, answer: b, missing: 'right' },
            divideByB: { text: `${product} ÷ ${b} = ?`, answer: a, missing: 'left' }
        };
        return questions[skillId];
    }

    function createChoices(answer, fact) {
        const choices = new Set([answer]);
        const candidates = [
            answer - fact.a,
            answer + fact.a,
            answer - fact.b,
            answer + fact.b,
            answer - 1,
            answer + 1,
            fact.a,
            fact.b
        ];
        candidates.forEach((candidate) => { if (candidate > 0 && choices.size < 4) choices.add(candidate); });
        let fallback = 1;
        while (choices.size < 4) { if (!choices.has(fallback)) choices.add(fallback); fallback += 1; }
        return [...choices].sort(() => Math.random() - .5);
    }

    function answerQuestion(choice, clickedButton) {
        if (questionAnswered || !currentQuestion) return;
        const { fact, skill, question } = currentQuestion;
        const questionTable = currentQuestion.table || FAMILY_ORDER[activeFamilyIndex];
        const correct = Number(choice) === question.answer;
        const isWarmup = practiceMode === 'warmup';
        const factStats = state.facts[fact.key] || (state.facts[fact.key] = { attempts: 0, correct: 0, hints: 0, lastSeen: null });
        factStats.attempts += 1;
        factStats.lastSeen = new Date().toISOString();
        if (hintLevel > 0) factStats.hints += 1;
        sessionAnswered += 1;
        document.querySelectorAll('.answer-button').forEach((button) => { button.disabled = true; });
        if (correct) {
            factStats.correct += 1;
            sessionCorrect += 1;
            clickedButton.classList.add('correct');
            if (!isWarmup && hintLevel === 0) {
                state.certification[questionTable][fact.key][skill.id] = Math.min(PASS_TARGET, state.certification[questionTable][fact.key][skill.id] + 1);
            }
            const passes = state.certification[questionTable][fact.key][skill.id];
            if (isWarmup) {
                warmupRemaining -= 1;
                warmupCorrect += 1;
                els.feedback.textContent = `Nice work! ${warmupRemaining} warm-up ${warmupRemaining === 1 ? 'question' : 'questions'} to go.`;
            } else {
                els.feedback.textContent = hintLevel === 0 ? `You got it! This fact is ${passes}/${PASS_TARGET} strong.` : 'You found it with a clue. We will come back and try it independently later.';
            }
            els.feedback.className = 'feedback good';
        } else {
            clickedButton.classList.add('wrong');
            const correctButton = [...document.querySelectorAll('.answer-button')].find((button) => Number(button.textContent) === question.answer);
            if (correctButton) correctButton.classList.add('correct');
            els.feedback.textContent = isWarmup ? 'That is okay. Warm-ups are for finding the way in.' : hintLevel > 0 ? `The answer is ${question.answer}. We can try it independently another time.` : 'No worries. We will park this one and come back to it later.';
            els.feedback.className = 'feedback try';
            showSupport(1, true);
        }
        questionAnswered = true;
        els.hintButton.classList.add('hidden');
        els.helpButton.classList.add('hidden');
        els.skipButton.classList.add('hidden');
        els.nextButton.classList.remove('hidden');
        els.nextButton.textContent = isWarmup && warmupRemaining === 0 ? 'Start the challenge' : isWarmup ? 'Next warm-up' : 'Next one';
        els.sessionCount.textContent = `${sessionCorrect} little wins`;
        saveState();
        render();
        if (!isWarmup && questionTable === FAMILY_ORDER[activeFamilyIndex] && isFamilyCertified(questionTable)) completeFamily(questionTable);
    }

    function showSupport(level = 1, automatic = false) {
        if (!currentQuestion) return;
        hintLevel = Math.max(hintLevel, level);
        const { fact, skill, question } = currentQuestion;
        if (hintLevel === 1) {
            if (skill.id === 'divideByA') els.hintMessage.textContent = `Turn it into multiplication: ${fact.a} × ? = ${fact.product}`;
            else if (skill.id === 'divideByB') els.hintMessage.textContent = `Turn it into multiplication: ${fact.b} × ? = ${fact.product}`;
            else if (skill.id === 'missingFactorA') els.hintMessage.textContent = `Use the family: ? × ${fact.b} = ${fact.product}`;
            else if (skill.id === 'missingFactorB') els.hintMessage.textContent = `Use the family: ${fact.a} × ? = ${fact.product}`;
            else els.hintMessage.textContent = `Start with the family: ${fact.a} × ${fact.b} = ${fact.product}`;
        } else {
            els.hintMessage.textContent = `The family is ${fact.a}, ${fact.b} and ${fact.product}. The answer here is ${question.answer}.`;
        }
        els.hintButton.classList.add('hidden');
        if (!automatic) els.helpButton.classList.add('hidden');
    }

    function requestHelp() {
        if (questionAnswered || !currentQuestion) return;
        els.feedback.textContent = 'Good choice. Here is the first step.';
        els.feedback.className = 'feedback good';
        showSupport(1);
        els.helpButton.classList.add('hidden');
    }

    function shouldOfferSessionBreak() {
        return practiceMode === 'certification' && !sessionBreakOffered && (sessionAnswered >= 8 || (sessionAnswered >= 6 && sessionCorrect >= 4));
    }

    function openSessionBreak() {
        sessionBreakOffered = true;
        els.sessionCopy.textContent = `You have made ${sessionCorrect} little wins in ${sessionAnswered} questions. Your brain can have a rest, or you can choose one more short round.`;
        els.sessionModal.classList.remove('hidden');
    }

    function closeSessionBreak() { els.sessionModal.classList.add('hidden'); }

    function finishSession() {
        closeSessionBreak();
        currentQuestion = null;
        questionAnswered = false;
        practiceMode = 'certification';
        sessionAnswered = 0;
        sessionCorrect = 0;
        sessionBreakOffered = false;
        els.startButton.classList.remove('hidden');
        els.nextButton.classList.add('hidden');
        els.hintButton.classList.add('hidden');
        els.helpButton.classList.add('hidden');
        els.skipButton.classList.add('hidden');
        els.feedback.textContent = 'That was a thoughtful session. Come back when your brain is ready.';
        els.feedback.className = 'feedback good';
        render();
    }

    function continueSession() {
        closeSessionBreak();
        sessionAnswered = 0;
        sessionCorrect = 0;
        sessionBreakOffered = false;
        beginQuestion();
    }

    function parkQuestion() {
        if (questionAnswered || !currentQuestion) return;
        const { fact, question } = currentQuestion;
        const factStats = state.facts[fact.key] || (state.facts[fact.key] = { attempts: 0, correct: 0, hints: 0, lastSeen: null });
        factStats.hints += 1;
        sessionAnswered += 1;
        hintLevel = Math.max(hintLevel, 2);
        showSupport(2, true);
        document.querySelectorAll('.answer-button').forEach((button) => { button.disabled = true; });
        const correctButton = [...document.querySelectorAll('.answer-button')].find((button) => Number(button.textContent) === question.answer);
        if (correctButton) correctButton.classList.add('correct');
        if (practiceMode === 'warmup') warmupRemaining = Math.max(0, warmupRemaining - 1);
        questionAnswered = true;
        els.feedback.textContent = 'Parked safely. We will meet this one again later.';
        els.feedback.className = 'feedback good';
        els.hintButton.classList.add('hidden');
        els.helpButton.classList.add('hidden');
        els.skipButton.classList.add('hidden');
        els.nextButton.classList.remove('hidden');
        els.nextButton.textContent = practiceMode === 'warmup' && warmupRemaining === 0 ? 'Start the challenge' : practiceMode === 'warmup' ? 'Next warm-up' : 'Next one';
        saveState();
    }

    function nextQuestion() {
        const table = FAMILY_ORDER[activeFamilyIndex];
        if (practiceMode === 'warmup') {
            if (warmupRemaining > 0) beginWarmupQuestion(table);
            else beginQuestion();
            return;
        }
        if (isFamilyCertified(table)) return;
        if (shouldOfferSessionBreak()) {
            openSessionBreak();
            return;
        }
        beginQuestion();
    }

    function completeFamily(table) {
        const index = FAMILY_ORDER.indexOf(table);
        state.highestUnlocked = Math.max(state.highestUnlocked, Math.min(index + 1, FAMILY_ORDER.length - 1));
        saveState();
        currentQuestion = null;
        questionAnswered = false;
        els.startButton.classList.remove('hidden');
        els.nextButton.classList.add('hidden');
        els.hintButton.classList.add('hidden');
        els.startButton.textContent = index === FAMILY_ORDER.length - 1 ? 'Keep practising' : `Learn ×${FAMILY_ORDER[index + 1]} next`;
        els.feedback.textContent = index === FAMILY_ORDER.length - 1 ? 'You have made every table strong. Brilliant!' : `×${table} is strong. ×${FAMILY_ORDER[index + 1]} is ready to explore.`;
        els.feedback.className = 'feedback good';
        showToast(index === FAMILY_ORDER.length - 1 ? 'The whole trail is complete!' : `×${FAMILY_ORDER[index + 1]} is ready to explore`);
        render();
    }

    function resetPracticeView() {
        currentQuestion = null;
        questionAnswered = false;
        hintLevel = 0;
        practiceMode = 'certification';
        warmupRemaining = 0;
        sessionAnswered = 0;
        sessionCorrect = 0;
        sessionBreakOffered = false;
        els.startButton.classList.remove('hidden');
        els.startButton.textContent = 'Start learning';
        els.hintButton.classList.add('hidden');
        els.helpButton.classList.add('hidden');
        els.skipButton.classList.add('hidden');
        els.nextButton.classList.add('hidden');
        els.feedback.textContent = '';
        els.feedback.className = 'feedback';
    }

    function resetAllProgress() {
        if (!window.confirm('Are you sure you want to clear all times-table progress?')) return;
        state = defaultState();
        activeFamilyIndex = 0;
        resetPracticeView();
        saveState();
        render();
        showToast('Progress is ready for a fresh start');
    }

    function showToast(message) {
        clearTimeout(toastTimer);
        els.toast.textContent = message;
        els.toast.classList.add('show');
        toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2400);
    }

    els.startButton.addEventListener('click', () => {
        if (isFamilyCertified(FAMILY_ORDER[activeFamilyIndex])) {
            const nextIndex = Math.min(activeFamilyIndex + 1, FAMILY_ORDER.length - 1);
            if (nextIndex !== activeFamilyIndex && isFamilyUnlocked(nextIndex)) { activeFamilyIndex = nextIndex; render(); }
        }
        const table = FAMILY_ORDER[activeFamilyIndex];
        if (!isStudyComplete(table)) {
            openStudy(table);
            return;
        }
        if (studyRecord(table).ready) beginQuestion();
        else beginWarmup();
    });
    els.hintButton.addEventListener('click', () => showSupport(hintLevel + 1));
    els.helpButton.addEventListener('click', requestHelp);
    els.skipButton.addEventListener('click', parkQuestion);
    els.nextButton.addEventListener('click', nextQuestion);
    els.cheatsheetButton.addEventListener('click', () => openStudy());
    els.closeStudy.addEventListener('click', closeStudy);
    els.studyFamilyPreview.addEventListener('click', (event) => {
        const button = event.target.closest('[data-study-index]');
        if (button) selectStudyFact(Number(button.dataset.studyIndex));
    });
    els.studyModal.addEventListener('click', (event) => {
        if (event.target === els.studyModal) closeStudy();
    });
    els.studyReadyButton.addEventListener('click', () => {
        const table = FAMILY_ORDER[activeFamilyIndex];
        if (selectedStudyTable !== table || !isStudyComplete(table)) return;
        studyRecord(table).ready = true;
        saveState();
        closeStudy();
        resetPracticeView();
        render();
        showToast(`×${table} explored. Time for a warm-up`);
        beginWarmup();
    });
    els.finishSession.addEventListener('click', finishSession);
    els.continueSession.addEventListener('click', continueSession);
    els.resetProgress.addEventListener('click', resetAllProgress);

    render();
})();
