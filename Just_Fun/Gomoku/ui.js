(function () {
  const G = window.Gomoku;
  const pointsEl = document.getElementById('points');
  const gridEl = document.getElementById('grid-lines');
  const statusEl = document.getElementById('status');
  const undoBtn = document.getElementById('undo-btn');
  const restartBtn = document.getElementById('restart-btn');
  const modeSeg = document.getElementById('mode-seg');
  const difficultySeg = document.getElementById('difficulty-seg');
  const firstSeg = document.getElementById('first-seg');
  const frameEl = document.getElementById('board-frame');

  const L = window.GomokuLoupe;
  const loupeEl = document.getElementById('loupe');
  const sceneEl = document.getElementById('loupe-scene');
  const buttons = [];
  let game = null;
  let thinking = false;
  let timer = 0;
  let token = 0;
  let lastPlaced = -1;
  let activePointer = null;
  const settings = {
    mode: 'pvp',
    difficulty: 'easy',
    humanFirst: true,
  };

  function drawGrid() {
    const parts = [];
    for (let i = 0; i < G.SIZE; i += 1) {
      const p = i + 0.5;
      parts.push(`<line x1="${p}" y1="0.5" x2="${p}" y2="${G.SIZE - 0.5}"></line>`);
      parts.push(`<line x1="0.5" y1="${p}" x2="${G.SIZE - 0.5}" y2="${p}"></line>`);
    }
    [3, 7, 11].forEach((r) => {
      [3, 7, 11].forEach((c) => {
        parts.push(`<circle cx="${c + 0.5}" cy="${r + 0.5}" r="0.16"></circle>`);
      });
    });
    gridEl.innerHTML = parts.join('');
  }

  function buildPoints() {
    for (let r = 0; r < G.SIZE; r += 1) {
      for (let c = 0; c < G.SIZE; c += 1) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'point';
        button.dataset.r = String(r);
        button.dataset.c = String(c);
        const stone = document.createElement('span');
        stone.className = 'stone';
        const ghost = document.createElement('span');
        ghost.className = 'stone ghost';
        button.append(stone, ghost);
        button.addEventListener('click', (event) => {
          if (event.pointerType === 'touch' || event.pointerType === 'pen') return;
          if (event.sourceCapabilities && event.sourceCapabilities.firesTouchEvents) return;
          onPoint(r, c);
        });
        pointsEl.append(button);
        buttons.push(button);
      }
    }
  }

  function humanColor() {
    return settings.humanFirst ? G.BLACK : G.WHITE;
  }

  function cancelThink() {
    token += 1;
    window.clearTimeout(timer);
    thinking = false;
  }

  function startGame() {
    cancelThink();
    lastPlaced = -1;
    game = G.createGame({
      mode: settings.mode,
      difficulty: settings.difficulty,
      humanColor: humanColor(),
    });
    render();
    maybeComputer();
  }

  function maybeComputer() {
    if (game.mode !== 'cpu' || game.winner || game.draw) return;
    if (game.turn === game.humanColor) return;
    thinking = true;
    render();
    const myToken = token;
    const delay = game.difficulty === 'normal' ? 700 : 480;
    timer = window.setTimeout(() => {
      if (myToken !== token) return;
      const move = G.chooseComputerMove(game.board, game.turn, game.difficulty);
      thinking = false;
      if (move) {
        G.place(game, move.r, move.c);
        lastPlaced = game.history.length - 1;
      }
      render();
    }, delay);
  }

  function canAim() {
    if (!game || thinking || game.winner || game.draw) return false;
    if (game.mode === 'cpu' && game.turn !== game.humanColor) return false;
    return true;
  }

  function canPlay(r, c) {
    return canAim() && game.board[r][c] === G.EMPTY;
  }

  function onPoint(r, c) {
    if (!game || thinking || game.winner || game.draw) return;
    if (game.mode === 'cpu' && game.turn !== game.humanColor) return;
    const result = G.place(game, r, c);
    if (!result.ok) return;
    lastPlaced = game.history.length - 1;
    render();
    maybeComputer();
  }

  function statusMessage() {
    if (game.draw) {
      return {
        kind: 'is-draw',
        title: '平局啦！',
        sub: "It's a draw. The board is full.",
      };
    }
    if (game.winner) {
      if (game.mode === 'cpu') {
        if (game.winner === game.humanColor) {
          return { kind: 'is-win', title: '你赢啦！', sub: 'You made five in a row!' };
        }
        return { kind: 'is-win', title: '电脑赢了', sub: 'The computer won. Try again!' };
      }
      return {
        kind: 'is-win',
        title: `${game.winner === G.BLACK ? '黑棋赢啦！' : '白棋赢啦！'}`,
        sub: `${game.winner === G.BLACK ? 'Black' : 'White'} made five in a row!`,
      };
    }
    if (thinking || (game.mode === 'cpu' && game.turn !== game.humanColor)) {
      return { kind: 'is-think', title: '电脑在想…', sub: 'The computer is thinking.' };
    }
    if (game.mode === 'cpu') {
      return { kind: '', title: '轮到你啦', sub: 'Your turn. Tap a crossing.' };
    }
    const zh = game.turn === G.BLACK ? '轮到黑棋' : '轮到白棋';
    return { kind: '', title: zh, sub: `${game.turn === G.BLACK ? 'Black' : 'White'}'s turn. Tap a crossing.` };
  }

  function render() {
    const win = new Set((game.winLine || []).map(([r, c]) => r * G.SIZE + c));
    const last = game.history.length ? game.history[game.history.length - 1] : null;
    const preview = game.mode === 'cpu' ? game.humanColor : game.turn;
    const showGhost = !thinking && !game.winner && !game.draw && (game.mode === 'pvp' || game.turn === game.humanColor);

    buttons.forEach((button, index) => {
      const r = Math.floor(index / G.SIZE);
      const c = index % G.SIZE;
      const value = game.board[r][c];
      const stone = button.firstElementChild;
      const ghost = stone.nextElementSibling;
      const popped = index === (last ? last.r * G.SIZE + last.c : -2) && lastPlaced === game.history.length - 1;
      stone.className = 'stone';
      if (value === G.BLACK) stone.classList.add('is-black');
      if (value === G.WHITE) stone.classList.add('is-white');
      if (last && last.r === r && last.c === c) stone.classList.add('is-last');
      if (win.has(index)) stone.classList.add('is-win');
      if (popped && value !== G.EMPTY) stone.classList.add('pop');
      ghost.className = 'stone ghost';
      if (showGhost && value === G.EMPTY) {
        ghost.classList.add('is-preview', preview === G.BLACK ? 'is-black' : 'is-white');
      }
      const color = value === G.BLACK ? 'black stone' : value === G.WHITE ? 'white stone' : 'empty';
      button.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}, ${color}`);
    });

    const message = statusMessage();
    statusEl.className = `status ${message.kind}`.trim();
    statusEl.innerHTML = `<span lang="zh-Hans">${message.title}</span><span class="status-sub">${message.sub}</span>`;
    undoBtn.disabled = game.history.length === 0;
    frameEl.classList.toggle('is-over', Boolean(game.winner || game.draw));
    difficultySeg.hidden = settings.mode !== 'cpu';
    firstSeg.hidden = settings.mode !== 'cpu';
    syncPressed(modeSeg, 'mode', settings.mode);
    syncPressed(difficultySeg, 'difficulty', settings.difficulty);
    syncPressed(firstSeg, 'first', settings.humanFirst ? 'human' : 'computer');
  }

  function syncPressed(group, key, value) {
    group.querySelectorAll('button').forEach((button) => {
      button.setAttribute('aria-pressed', button.dataset[key] === value ? 'true' : 'false');
    });
  }

  undoBtn.addEventListener('click', () => {
    if (!game || game.history.length === 0) return;
    cancelThink();
    G.undo(game);
    lastPlaced = -1;
    render();
    maybeComputer();
  });

  restartBtn.addEventListener('click', startGame);

  modeSeg.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.mode === settings.mode) return;
    settings.mode = button.dataset.mode;
    startGame();
  });

  difficultySeg.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    settings.difficulty = button.dataset.difficulty;
    game.difficulty = settings.difficulty;
    render();
  });

  firstSeg.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const humanFirst = button.dataset.first === 'human';
    if (humanFirst === settings.humanFirst) return;
    settings.humanFirst = humanFirst;
    startGame();
  });

  function viewportMargins() {
    const pad = window.getComputedStyle(document.querySelector('.app'));
    const num = (value) => {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? Math.max(8, parsed) : 8;
    };
    return {
      top: num(pad.paddingTop),
      right: num(pad.paddingRight),
      bottom: num(pad.paddingBottom),
      left: num(pad.paddingLeft),
    };
  }

  function markAim(cell) {
    document.querySelectorAll('.point.is-aim').forEach((el) => el.classList.remove('is-aim'));
    if (!cell || !canPlay(cell.r, cell.c)) return;
    document.querySelectorAll(`.point[data-r="${cell.r}"][data-c="${cell.c}"]`).forEach((el) => {
      el.classList.add('is-aim');
    });
  }

  function buildLoupeClone() {
    const rect = frameEl.getBoundingClientRect();
    const clone = frameEl.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.maxWidth = 'none';
    clone.style.maxHeight = 'none';
    clone.style.transformOrigin = '0 0';
    sceneEl.replaceChildren(clone);
  }

  function positionLoupe(clientX, clientY) {
    const frame = frameEl.getBoundingClientRect();
    const points = pointsEl.getBoundingClientRect();
    const size = loupeEl.offsetWidth || 168;
    const scale = L.magnification(points.width / G.SIZE, size);
    const clone = sceneEl.querySelector('.board-frame');
    if (clone) {
      const tx = clientX - frame.left;
      const ty = clientY - frame.top;
      clone.style.transform = `translate(${size / 2 - tx * scale}px, ${size / 2 - ty * scale}px) scale(${scale})`;
    }
    const pos = L.placeLoupe({
      x: clientX,
      y: clientY,
      size,
      gap: 32,
      vw: window.innerWidth,
      vh: window.innerHeight,
      margin: viewportMargins(),
    });
    loupeEl.style.left = `${pos.left}px`;
    loupeEl.style.top = `${pos.top}px`;
  }

  function showLoupe(clientX, clientY) {
    loupeEl.hidden = false;
    buildLoupeClone();
    const cell = L.cellFromPoint(clientX, clientY, pointsEl.getBoundingClientRect(), G.SIZE);
    markAim(cell);
    positionLoupe(clientX, clientY);
  }

  function moveLoupe(clientX, clientY) {
    const cell = L.cellFromPoint(clientX, clientY, pointsEl.getBoundingClientRect(), G.SIZE);
    markAim(cell);
    positionLoupe(clientX, clientY);
  }

  function hideLoupe() {
    markAim(null);
    loupeEl.hidden = true;
    sceneEl.replaceChildren();
  }

  function finishTouch(event, place) {
    if (event.pointerId !== activePointer) return;
    activePointer = null;
    const cell = place ? L.cellFromPoint(event.clientX, event.clientY, pointsEl.getBoundingClientRect(), G.SIZE) : null;
    const playable = Boolean(cell && canPlay(cell.r, cell.c));
    hideLoupe();
    if (playable) onPoint(cell.r, cell.c);
  }

  frameEl.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' || event.button !== 0 || !canAim()) return;
    event.preventDefault();
    activePointer = event.pointerId;
    try {
      frameEl.setPointerCapture(event.pointerId);
    } catch (err) {
      /* The loupe still follows pointermove on the board. */
    }
    showLoupe(event.clientX, event.clientY);
  }, { passive: false });

  frameEl.addEventListener('pointermove', (event) => {
    if (event.pointerId !== activePointer) return;
    event.preventDefault();
    moveLoupe(event.clientX, event.clientY);
  }, { passive: false });

  frameEl.addEventListener('pointerup', (event) => finishTouch(event, true));
  frameEl.addEventListener('pointercancel', (event) => finishTouch(event, false));

  frameEl.addEventListener('touchmove', (event) => {
    event.preventDefault();
  }, { passive: false });

  document.addEventListener('touchmove', (event) => {
    if (activePointer !== null) event.preventDefault();
  }, { passive: false });

  document.addEventListener('gesturestart', (event) => event.preventDefault());
  frameEl.addEventListener('dblclick', (event) => event.preventDefault());

  drawGrid();
  buildPoints();
  startGame();
  window.__gomokuView = () => ({ game, thinking, settings });
})();
