document.addEventListener('DOMContentLoaded', () => {
  const el = {
    body: document.body,
    practiceScreen: document.getElementById('practice-screen'),
    questionPanel: document.querySelector('.question-panel'),
    summaryPanel: document.getElementById('summary-panel'),
    progressLabel: document.getElementById('progress-label'),
    scoreLabel: document.getElementById('score-label'),
    domainPill: document.getElementById('domain-pill'),
    skillPill: document.getElementById('skill-pill'),
    questionTitle: document.getElementById('question-title'),
    prompt: document.getElementById('question-prompt'),
    form: document.getElementById('answer-form'),
    answerInput: document.getElementById('answer-input'),
    submitBtn: document.getElementById('submit-answer'),
    feedback: document.getElementById('feedback'),
    nextBtn: document.getElementById('next-question'),
    restartBtn: document.getElementById('restart-session'),
    playAgainBtn: document.getElementById('play-again'),
    summaryScore: document.getElementById('summary-score'),
    strengthList: document.getElementById('strength-list'),
    weaknessList: document.getElementById('weakness-list'),
    drawerToggle: document.getElementById('drawer-toggle'),
    drawerToggleText: document.querySelector('#drawer-toggle span:first-child'),
    clearWorking: document.getElementById('clear-working'),
    toolTabs: document.querySelectorAll('.tool-tab'),
    scratchTools: document.querySelectorAll('.scratch-tool'),
    workspace: document.getElementById('workspace'),
    spawnBtns: document.querySelectorAll('.spawn-btn'),
    resultBoxBtn: document.getElementById('btn-result-box'),
    subtractHint: document.getElementById('subtract-hint'),
    targetTotal: document.getElementById('target-total'),
    knownPart: document.getElementById('known-part'),
    missingPart: document.getElementById('missing-part'),
    targetFrame: document.getElementById('target-frame'),
    targetHint: document.getElementById('target-hint'),
    numberLineCanvas: document.getElementById('numberLineCanvas'),
    lineControls: document.querySelector('.line-controls'),
    lineReset: document.getElementById('line-reset'),
  };

  const domainLabels = {
    NPV: 'Number & Place Value',
    AS: 'Addition & Subtraction',
  };

  const skillLabels = {
    base_ten: 'Tens and ones',
    number_bonds_20: 'Number bonds to 20',
    add_tens: 'Add tens',
    subtract_tens: 'Subtract tens',
    two_digit_plus_one_digit: 'Two-digit + one-digit',
    two_digit_minus_one_digit: 'Two-digit - one-digit',
    missing_number: 'Missing number',
    related_facts_100: 'Number bonds to 100',
    bridge_ten_addition: 'Bridge through ten',
  };

  const adviceBySkill = {
    base_ten: 'Build the tens first, then add the ones.',
    number_bonds_20: 'Look at the whole, then count the empty spaces to find the missing part.',
    add_tens: 'Use rods first. The ones stay the same when you add tens.',
    subtract_tens: 'Cross out rods first. The ones stay the same when you subtract tens.',
    two_digit_plus_one_digit: 'Build the first number, add the ones, and fuse 10 dots into a rod if needed.',
    two_digit_minus_one_digit: 'Build the first number, then cross out the ones you take away.',
    missing_number: 'Use the make-target frame: the empty spaces show the missing part.',
    related_facts_100: 'Think in tens: 30 and 70 make 100, just like 3 and 7 make 10.',
    bridge_ten_addition: 'Make the next ten first, then add what is left.',
  };

  const sessionState = {
    questions: [],
    currentIndex: 0,
    results: [],
    submitted: false,
  };

  const scratchState = {
    zIndex: 10,
    spawnRow: { rod: 0, dot: 0 },
    dragged: null,
    offsetX: 0,
    offsetY: 0,
    downX: 0,
    downY: 0,
    longPressTimer: null,
    lineValue: 0,
  };

  const R = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (items) => items[Math.floor(Math.random() * items.length)];

  function makeQuestion(id, domain, skill, template, prompt, answer, support, data = {}) {
    return {
      id,
      domain,
      skill,
      template,
      interaction: 'numeric_input',
      prompt,
      answer,
      marking: { type: 'exact_number' },
      support,
      data,
    };
  }

  const questionBank = {
    generateSession() {
      const q = [];

      const tens = R(2, 8);
      const ones = R(1, 9);
      q.push(makeQuestion(
        'NPV_BASE_TEN_001',
        'NPV',
        'base_ten',
        'expanded_form',
        `${tens * 10} + ${ones} =`,
        tens * 10 + ones,
        ['blocks']
      ));

      const bondA = R(4, 16);
      q.push(makeQuestion(
        'AS_BOND_20_001',
        'AS',
        'number_bonds_20',
        'a_plus_blank_equals_20',
        `${bondA} + ? = 20`,
        20 - bondA,
        ['make_target', 'bar_model'],
        { whole: 20, known: bondA, missingPosition: 'right_addend' }
      ));

      const addTenA = R(21, 69);
      const addTenB = pick([10, 20, 30]);
      q.push(makeQuestion(
        'AS_ADD_TENS_001',
        'AS',
        'add_tens',
        'two_digit_plus_tens',
        `${addTenA} + ${addTenB} =`,
        addTenA + addTenB,
        ['blocks', 'number_line']
      ));

      const subTenB = pick([10, 20, 30]);
      const subTenA = R(5, 8) * 10 + R(1, 9);
      q.push(makeQuestion(
        'AS_SUB_TENS_001',
        'AS',
        'subtract_tens',
        'two_digit_minus_tens',
        `${subTenA} - ${subTenB} =`,
        subTenA - subTenB,
        ['blocks', 'number_line']
      ));

      const addA = R(21, 68);
      const addB = R(1, Math.min(9, 99 - addA));
      q.push(makeQuestion(
        'AS_ADD_2D_1D_001',
        'AS',
        'two_digit_plus_one_digit',
        'a_plus_b',
        `${addA} + ${addB} =`,
        addA + addB,
        ['blocks', 'number_line']
      ));

      const missingTotal = R(30, 75);
      const missingPart = R(7, 24);
      q.push(makeQuestion(
        'AS_MISSING_001',
        'AS',
        'missing_number',
        'a_plus_blank_equals_b',
        `${missingTotal - missingPart} + ? = ${missingTotal}`,
        missingPart,
        ['make_target', 'bar_model'],
        { whole: missingTotal, known: missingTotal - missingPart, missingPosition: 'right_addend' }
      ));

      const subA = R(32, 85);
      const maxSub = Math.min(9, subA - 10);
      const subB = R(1, maxSub);
      q.push(makeQuestion(
        'AS_SUB_2D_1D_001',
        'AS',
        'two_digit_minus_one_digit',
        'a_minus_b',
        `${subA} - ${subB} =`,
        subA - subB,
        ['blocks', 'number_line']
      ));

      const factA = pick([10, 20, 30, 40, 50, 60, 70, 80, 90]);
      q.push(makeQuestion(
        'AS_BOND_100_001',
        'AS',
        'related_facts_100',
        'tens_plus_blank_equals_100',
        `${factA} + ? = 100`,
        100 - factA,
        ['make_target', 'bar_model'],
        { whole: 100, known: factA, missingPosition: 'right_addend' }
      ));

      const bridgeA = pick([28, 29, 38, 39, 47, 48, 58, 69]);
      const toNextTen = 10 - (bridgeA % 10);
      const bridgeB = R(toNextTen + 1, 9);
      q.push(makeQuestion(
        'AS_BRIDGE_10_001',
        'AS',
        'bridge_ten_addition',
        'a_plus_b_bridge_ten',
        `${bridgeA} + ${bridgeB} =`,
        bridgeA + bridgeB,
        ['blocks', 'number_line']
      ));

      const hardTotal = 100;
      const hardA = pick([25, 35, 45, 55, 65, 75]);
      q.push(makeQuestion(
        'AS_MISSING_100_001',
        'AS',
        'missing_number',
        'a_plus_blank_equals_100',
        `${hardA} + ? = ${hardTotal}`,
        hardTotal - hardA,
        ['make_target', 'bar_model'],
        { whole: hardTotal, known: hardA, missingPosition: 'right_addend' }
      ));

      return q;
    },
  };

  function startSession() {
    sessionState.questions = questionBank.generateSession();
    sessionState.currentIndex = 0;
    sessionState.results = [];
    sessionState.submitted = false;
    el.summaryPanel.classList.add('hidden');
    el.questionPanel.classList.remove('hidden');
    renderQuestion();
    scratchpad.clearAll();
  }

  function currentQuestion() {
    return sessionState.questions[sessionState.currentIndex];
  }

  function renderQuestion() {
    const q = currentQuestion();
    sessionState.submitted = false;

    el.progressLabel.textContent = `Question ${sessionState.currentIndex + 1} / ${sessionState.questions.length}`;
    el.scoreLabel.textContent = `${sessionState.results.filter((r) => r.isCorrect).length} correct`;
    el.domainPill.textContent = domainLabels[q.domain] || q.domain;
    el.skillPill.textContent = skillLabels[q.skill] || q.skill;
    el.questionTitle.textContent = 'Work it out';
    el.prompt.textContent = q.prompt;
    el.answerInput.value = '';
    el.answerInput.disabled = false;
    el.submitBtn.disabled = false;
    el.nextBtn.disabled = true;
    el.feedback.textContent = 'Use the scratchpad if you want to build it out.';
    el.feedback.className = 'feedback';
    setSuggestedTool(q.support[0]);
    scratchpad.updateForQuestion(q);
    setTimeout(() => el.answerInput.focus(), 80);
  }

  function markCurrentQuestion() {
    const q = currentQuestion();
    const raw = el.answerInput.value.trim();
    if (!raw) {
      el.feedback.textContent = 'Pop an answer in when you are ready. You can use the blocks first.';
      el.feedback.className = 'feedback incorrect';
      return;
    }

    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) {
      el.feedback.textContent = 'This one needs a number answer.';
      el.feedback.className = 'feedback incorrect';
      return;
    }

    const isCorrect = numeric === q.answer;
    sessionState.submitted = true;
    sessionState.results.push({
      questionId: q.id,
      domain: q.domain,
      skill: q.skill,
      prompt: q.prompt,
      answer: q.answer,
      userAnswer: numeric,
      isCorrect,
    });

    el.answerInput.disabled = true;
    el.submitBtn.disabled = true;
    el.nextBtn.disabled = false;
    el.scoreLabel.textContent = `${sessionState.results.filter((r) => r.isCorrect).length} correct`;

    if (isCorrect) {
      el.feedback.textContent = 'Good thinking. That answer is correct.';
      el.feedback.className = 'feedback correct';
    } else {
      el.feedback.textContent = `Try again next time. The answer is ${q.answer}. ${adviceBySkill[q.skill] || 'The blocks can help you check the steps.'}`;
      el.feedback.className = 'feedback incorrect';
    }
  }

  function goNext() {
    if (!sessionState.submitted) return;
    if (sessionState.currentIndex + 1 >= sessionState.questions.length) {
      renderSummary();
      return;
    }
    sessionState.currentIndex++;
    renderQuestion();
    scratchpad.clearAll();
  }

  function renderSummary() {
    const total = sessionState.questions.length;
    const correct = sessionState.results.filter((r) => r.isCorrect).length;
    const bySkill = new Map();

    sessionState.results.forEach((result) => {
      const item = bySkill.get(result.skill) || { attempts: 0, correct: 0 };
      item.attempts++;
      if (result.isCorrect) item.correct++;
      bySkill.set(result.skill, item);
    });

    const strengths = [];
    const weaknesses = [];
    bySkill.forEach((value, skill) => {
      const label = skillLabels[skill] || skill;
      const rate = value.correct / value.attempts;
      if (rate === 1) strengths.push(label);
      if (rate < 1) weaknesses.push({ label, skill });
    });

    el.questionPanel.classList.add('hidden');
    el.summaryPanel.classList.remove('hidden');
    el.progressLabel.textContent = 'Complete';
    el.scoreLabel.textContent = `${correct} / ${total}`;
    el.summaryScore.textContent = `${correct} out of ${total} correct`;

    el.strengthList.innerHTML = `
      <h3>Looking strong</h3>
      <p>${strengths.length ? strengths.join(', ') : 'You kept going through the whole set. That matters.'}</p>
    `;

    if (weaknesses.length) {
      el.weaknessList.innerHTML = `
        <h3>Practise next</h3>
        <p>${weaknesses.map((w) => `${w.label}: ${adviceBySkill[w.skill] || 'Use the scratchpad to show the steps.'}`).join(' ')}</p>
      `;
    } else {
      el.weaknessList.innerHTML = `
        <h3>Practise next</h3>
        <p>Try another set with trickier numbers, especially questions that cross a ten.</p>
      `;
    }
  }

  function setSuggestedTool(tool) {
    const map = {
      blocks: 'blocks',
      make_target: 'make-target',
      number_line: 'number-line',
      bar_model: 'bar-model',
    };
    scratchpad.setTool(map[tool] || 'blocks');
    el.subtractHint.classList.toggle('hidden', !currentQuestion().prompt.includes('-'));
  }

  const scratchpad = {
    init() {
      el.drawerToggle.addEventListener('click', () => {
        const open = !el.body.classList.contains('drawer-open');
        el.body.classList.toggle('drawer-open', open);
        el.drawerToggle.setAttribute('aria-expanded', String(open));
        el.drawerToggleText.textContent = open ? 'Close Smart Blocks Scratchpad' : 'Open Smart Blocks Scratchpad';
      if (open) {
        requestAnimationFrame(() => {
          this.resizeNumberLine();
          this.drawNumberLine();
          this.updateForQuestion(currentQuestion());
        });
      }
      });

      el.toolTabs.forEach((tab) => {
        tab.addEventListener('click', () => this.setTool(tab.dataset.tool));
      });

      el.spawnBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const type = btn.dataset.type;
          const count = Number(btn.dataset.count) || 1;
          for (let i = 0; i < count; i++) {
            setTimeout(() => this.spawn(type), i * 50);
          }
        });
      });

      el.resultBoxBtn.addEventListener('click', () => this.generateResultBox());
      el.clearWorking.addEventListener('click', () => this.clearAll());

      el.lineControls.addEventListener('click', (event) => {
        const btn = event.target.closest('button[data-jump]');
        if (!btn) return;
        scratchState.lineValue = Math.max(0, Math.min(120, scratchState.lineValue + Number(btn.dataset.jump)));
        this.drawNumberLine();
      });

      el.lineReset.addEventListener('click', () => {
        scratchState.lineValue = 0;
        this.drawNumberLine();
      });

      window.addEventListener('resize', () => {
        this.resizeNumberLine();
        this.drawNumberLine();
        this.updateForQuestion(currentQuestion());
      });

      this.generateResultBox();
      this.resizeNumberLine();
      this.drawNumberLine();
      this.updateForQuestion(currentQuestion());
    },

    setTool(tool) {
      el.toolTabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.tool === tool));
      el.scratchTools.forEach((pane) => pane.classList.toggle('active', pane.id === `${tool}-tool`));
      if (tool === 'number-line') {
        requestAnimationFrame(() => {
          this.resizeNumberLine();
          this.drawNumberLine();
        });
      }
      if (tool === 'make-target') {
        this.updateForQuestion(currentQuestion());
      }
    },

    clearAll() {
      el.workspace.innerHTML = '';
      scratchState.spawnRow = { rod: 0, dot: 0 };
      scratchState.lineValue = 0;
      this.generateResultBox();
      this.drawNumberLine();
      this.updateForQuestion(currentQuestion());
    },

    updateForQuestion(question) {
      if (!question) return;
      if (question.data && Number.isFinite(question.data.whole) && Number.isFinite(question.data.known)) {
        this.renderMakeTarget(question.data.whole, question.data.known);
        return;
      }
      const answer = Number.isFinite(question.answer) ? question.answer : 20;
      this.renderMakeTarget(answer, 0);
    },

    renderMakeTarget(whole, known) {
      const safeWhole = Math.max(1, Math.min(120, Math.round(whole)));
      const safeKnown = Math.max(0, Math.min(safeWhole, Math.round(known)));
      const missing = safeWhole - safeKnown;

      el.targetTotal.textContent = safeWhole;
      el.knownPart.textContent = safeKnown;
      el.missingPart.textContent = '?';
      el.targetHint.textContent = `There are ${safeKnown} filled spaces. Count the empty spaces to make ${safeWhole}.`;

      el.targetFrame.innerHTML = '';
      el.targetFrame.classList.toggle('large-target', safeWhole > 30);
      for (let i = 0; i < safeWhole; i++) {
        const cell = document.createElement('div');
        cell.className = `target-cell${i < safeKnown ? ' filled' : ''}`;
        cell.setAttribute('aria-label', i < safeKnown ? 'known part' : 'empty space');
        el.targetFrame.appendChild(cell);
      }

      if (safeWhole > 40) {
        el.targetHint.textContent = `Think in tens first: ${safeKnown} is the known part. The empty spaces make the missing ${missing}.`;
      }
    },

    spawn(type, x = null, y = null) {
      const node = document.createElement('div');
      node.className = `manipulative ${type}`;

      if (x === null || y === null) {
        const pad = 16;
        if (type === 'rod') {
          const col = scratchState.spawnRow.rod % 7;
          const row = Math.floor(scratchState.spawnRow.rod / 7);
          x = pad + col * 48;
          y = pad + row * 172;
          scratchState.spawnRow.rod++;
        } else {
          const col = scratchState.spawnRow.dot % 10;
          const row = Math.floor(scratchState.spawnRow.dot / 10);
          const rodRows = Math.ceil(scratchState.spawnRow.rod / 7);
          x = pad + col * 46;
          y = pad + rodRows * 172 + row * 46;
          scratchState.spawnRow.dot++;
        }
      }

      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      this.setupInteraction(node);
      el.workspace.appendChild(node);
      this.updateZoneCounters();
      return node;
    },

    setupInteraction(node) {
      node.addEventListener('pointerdown', (event) => {
        if (event.button !== 0 && event.pointerType === 'mouse') return;
        event.preventDefault();

        scratchState.downX = event.clientX;
        scratchState.downY = event.clientY;
        scratchState.longPressTimer = setTimeout(() => {
          node.classList.remove('pressing');
          node.classList.toggle('removed');
          this.updateZoneCounters();
          scratchState.longPressTimer = null;
        }, 450);

        node.classList.add('pressing');
        scratchState.dragged = node;
        scratchState.zIndex++;
        node.style.zIndex = scratchState.zIndex;
        node.classList.add('dragging');
        node.setPointerCapture(event.pointerId);

        const rect = node.getBoundingClientRect();
        scratchState.offsetX = event.clientX - rect.left;
        scratchState.offsetY = event.clientY - rect.top;
      });

      node.addEventListener('pointermove', (event) => {
        if (scratchState.longPressTimer && Math.hypot(event.clientX - scratchState.downX, event.clientY - scratchState.downY) > 8) {
          clearTimeout(scratchState.longPressTimer);
          scratchState.longPressTimer = null;
          node.classList.remove('pressing');
        }

        if (scratchState.dragged !== node) return;

        const wsRect = el.workspace.getBoundingClientRect();
        let nx = event.clientX - wsRect.left - scratchState.offsetX;
        let ny = event.clientY - wsRect.top - scratchState.offsetY;
        nx = Math.max(0, Math.min(nx, wsRect.width - node.offsetWidth));
        ny = Math.max(0, Math.min(ny, wsRect.height - node.offsetHeight - 72));
        node.style.left = `${nx}px`;
        node.style.top = `${ny}px`;
        this.updateZoneCounters();
      });

      const release = (event) => {
        if (scratchState.longPressTimer) {
          clearTimeout(scratchState.longPressTimer);
          scratchState.longPressTimer = null;
        }
        node.classList.remove('pressing');

        if (scratchState.dragged !== node) return;
        scratchState.dragged = null;
        node.classList.remove('dragging');
        node.releasePointerCapture(event.pointerId);

        const dist = Math.hypot(event.clientX - scratchState.downX, event.clientY - scratchState.downY);
        if (dist < 8 && node.classList.contains('rod') && !node.classList.contains('removed')) {
          this.shatterRod(node);
          return;
        }
        if (node.classList.contains('dot') && !node.classList.contains('removed')) {
          this.checkFusing(node);
        }
        this.updateZoneCounters();
      };

      node.addEventListener('pointerup', release);
      node.addEventListener('pointercancel', release);
    },

    checkFusing(dropped) {
      const dots = Array.from(el.workspace.querySelectorAll('.dot:not(.removed)'));
      if (dots.length < 10) return;

      const nearby = dots
        .filter((dot) => this.distance(dropped, dot) < 128)
        .sort((a, b) => this.distance(dropped, a) - this.distance(dropped, b));

      if (nearby.length < 10) return;

      const ten = nearby.slice(0, 10);
      const nx = parseFloat(dropped.style.left);
      const ny = Math.max(0, parseFloat(dropped.style.top) - 72);
      ten.forEach((dot) => dot.remove());
      scratchState.spawnRow.dot = Math.max(0, scratchState.spawnRow.dot - 10);
      const rod = this.spawn('rod', nx, ny);
      rod.classList.add('fuse-animation');
      setTimeout(() => rod.classList.remove('fuse-animation'), 650);
      this.updateZoneCounters();
    },

    shatterRod(rod) {
      const rect = rod.getBoundingClientRect();
      const wsRect = el.workspace.getBoundingClientRect();
      const cx = rect.left - wsRect.left + rect.width / 2;
      const cy = rect.top - wsRect.top + rect.height / 2;
      rod.remove();

      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        const radius = 34 + Math.random() * 38;
        const dot = this.spawn('dot', cx + Math.cos(angle) * radius - 18, cy + Math.sin(angle) * radius - 18);
        dot.classList.add('shatter-animation');
        setTimeout(() => dot.classList.remove('shatter-animation'), 650);
      }
      this.updateZoneCounters();
    },

    generateResultBox() {
      el.workspace.querySelectorAll('.zone').forEach((zone) => zone.remove());
      const box = document.createElement('div');
      box.className = 'zone result-box';
      box.innerHTML = '<div><div class="zone-label">Result</div><div class="zone-count">0</div></div>';
      el.workspace.appendChild(box);
      this.updateZoneCounters();
    },

    updateZoneCounters() {
      const box = el.workspace.querySelector('.result-box');
      if (!box) return;
      const boxRect = box.getBoundingClientRect();
      let total = 0;
      el.workspace.querySelectorAll('.manipulative:not(.removed)').forEach((item) => {
        if (this.inside(item.getBoundingClientRect(), boxRect)) {
          total += item.classList.contains('rod') ? 10 : 1;
        }
      });
      box.querySelector('.zone-count').textContent = total;
    },

    resizeNumberLine() {
      const canvas = el.numberLineCanvas;
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      canvas.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);
    },

    drawNumberLine() {
      const canvas = el.numberLineCanvas;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      ctx.clearRect(0, 0, rect.width, rect.height);
      const y = rect.height * 0.48;
      const startX = 28;
      const endX = rect.width - 28;
      const max = 120;
      const step = (endX - startX) / 12;

      ctx.lineWidth = 5;
      ctx.strokeStyle = '#3977d6';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();

      ctx.fillStyle = '#172033';
      ctx.font = '800 14px Trebuchet MS, Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      for (let i = 0; i <= 12; i++) {
        const x = startX + step * i;
        ctx.strokeStyle = '#172033';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - 10);
        ctx.lineTo(x, y + 10);
        ctx.stroke();
        ctx.fillText(String(i * 10), x, y + 18);
      }

      const clamped = Math.max(0, Math.min(max, scratchState.lineValue));
      const markerX = startX + (clamped / max) * (endX - startX);
      ctx.fillStyle = '#ef6f5e';
      ctx.beginPath();
      ctx.arc(markerX, y - 34, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '900 17px Trebuchet MS, Verdana, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(clamped), markerX, y - 34);
    },

    distance(a, b) {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return Math.hypot(ar.left + ar.width / 2 - (br.left + br.width / 2), ar.top + ar.height / 2 - (br.top + br.height / 2));
    },

    inside(itemRect, zoneRect) {
      const cx = itemRect.left + itemRect.width / 2;
      const cy = itemRect.top + itemRect.height / 2;
      return cx >= zoneRect.left && cx <= zoneRect.right && cy >= zoneRect.top && cy <= zoneRect.bottom;
    },
  };

  el.form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!sessionState.submitted) markCurrentQuestion();
  });
  el.nextBtn.addEventListener('click', goNext);
  el.restartBtn.addEventListener('click', startSession);
  el.playAgainBtn.addEventListener('click', startSession);

  scratchpad.init();
  startSession();
});
