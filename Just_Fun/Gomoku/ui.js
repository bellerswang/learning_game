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

  const buttons = [];
  let game = null;
  let thinking = false;
  let timer = 0;
  let token = 0;
  let lastPlaced = -1;
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
        button.addEventListener('click', () => onPoint(r, c));
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

  frameEl.addEventListener('touchmove', (event) => {
    event.preventDefault();
  }, { passive: false });

  document.addEventListener('gesturestart', (event) => event.preventDefault());
  frameEl.addEventListener('dblclick', (event) => event.preventDefault());

  drawGrid();
  buildPoints();
  startGame();
  window.__gomokuView = () => ({ game, thinking, settings });
})();
