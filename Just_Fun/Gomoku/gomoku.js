// Gomoku rules and a beatable computer. No DOM, so the same file runs in the
// page and in Node tests.
const SIZE = 15;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;
const WIN_SCORE = 10000000;
const DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

function other(player) {
  return player === BLACK ? WHITE : BLACK;
}

function inBounds(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

function createGame(options = {}) {
  return {
    mode: options.mode === 'cpu' ? 'cpu' : 'pvp',
    difficulty: options.difficulty === 'normal' ? 'normal' : 'easy',
    humanColor: options.humanColor === WHITE ? WHITE : BLACK,
    board: Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY)),
    turn: BLACK,
    history: [],
    winner: null,
    winLine: null,
    draw: false,
  };
}

function isBoardFull(board) {
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (board[r][c] === EMPTY) return false;
    }
  }
  return true;
}

function findWinningLines(board, r, c, player) {
  if (!inBounds(r, c) || board[r][c] !== player) return [];
  const lines = [];
  for (const [dr, dc] of DIRS) {
    const cells = [[r, c]];
    for (const sign of [1, -1]) {
      let step = 1;
      while (step < SIZE) {
        const nr = r + dr * sign * step;
        const nc = c + dc * sign * step;
        if (!inBounds(nr, nc) || board[nr][nc] !== player) break;
        cells.push([nr, nc]);
        step += 1;
      }
    }
    if (cells.length >= 5) lines.push(cells);
  }
  return lines;
}

function place(game, r, c) {
  if (game.winner || game.draw) return { ok: false, reason: 'over' };
  if (!inBounds(r, c)) return { ok: false, reason: 'bounds' };
  if (game.board[r][c] !== EMPTY) return { ok: false, reason: 'occupied' };

  const player = game.turn;
  game.board[r][c] = player;
  game.history.push({ r, c, player });

  const lines = findWinningLines(game.board, r, c, player);
  if (lines.length) {
    const cells = [];
    for (const line of lines) {
      for (const cell of line) {
        if (!cells.some(([rr, cc]) => rr === cell[0] && cc === cell[1])) cells.push(cell);
      }
    }
    game.winner = player;
    game.winLine = cells;
  } else if (isBoardFull(game.board)) {
    game.draw = true;
  } else {
    game.turn = other(player);
  }
  return { ok: true };
}

function undo(game) {
  if (!game.history.length) return { ok: false, removed: 0 };

  const pop = () => {
    const move = game.history.pop();
    game.board[move.r][move.c] = EMPTY;
    return move;
  };

  let removed = 0;
  if (game.mode !== 'cpu') {
    pop();
    removed = 1;
  } else {
    const last = game.history[game.history.length - 1];
    pop();
    removed = 1;
    if (last.player !== game.humanColor) {
      const previous = game.history[game.history.length - 1];
      if (previous && previous.player === game.humanColor) {
        pop();
        removed = 2;
      }
    }
  }

  game.winner = null;
  game.winLine = null;
  game.draw = false;
  const current = game.history[game.history.length - 1];
  game.turn = current ? other(current.player) : BLACK;
  return { ok: true, removed };
}

function patternScore(board, r, c, player) {
  let score = 0;
  for (const [dr, dc] of DIRS) {
    let count = 1;
    let open = 0;
    for (const sign of [1, -1]) {
      let step = 1;
      while (step < SIZE) {
        const nr = r + dr * sign * step;
        const nc = c + dc * sign * step;
        if (!inBounds(nr, nc) || board[nr][nc] !== player) {
          if (inBounds(nr, nc) && board[nr][nc] === EMPTY) open += 1;
          break;
        }
        count += 1;
        step += 1;
      }
    }
    if (count >= 5) score += WIN_SCORE;
    else if (count === 4 && open === 2) score += 500000;
    else if (count === 4 && open === 1) score += 80000;
    else if (count === 3 && open === 2) score += 8000;
    else if (count === 3 && open === 1) score += 400;
    else if (count === 2 && open === 2) score += 200;
    else if (count === 2 && open === 1) score += 40;
    else if (count === 1 && open === 2) score += 8;
  }
  return score;
}

function centerBias(r, c) {
  return 14 - (Math.abs(r - 7) + Math.abs(c - 7));
}

function cellScore(board, r, c, player) {
  const mine = patternScore(board, r, c, player);
  if (mine >= WIN_SCORE) return mine;
  const theirs = patternScore(board, r, c, other(player));
  return mine + theirs * 1.2 + centerBias(r, c);
}

function candidates(board) {
  let anyStone = false;
  const cells = [];
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (board[r][c] !== EMPTY) {
        anyStone = true;
        continue;
      }
      let near = false;
      for (let rr = Math.max(0, r - 2); rr <= Math.min(SIZE - 1, r + 2) && !near; rr += 1) {
        for (let cc = Math.max(0, c - 2); cc <= Math.min(SIZE - 1, c + 2); cc += 1) {
          if (board[rr][cc] !== EMPTY) {
            near = true;
            break;
          }
        }
      }
      if (near) cells.push({ r, c });
    }
  }
  if (!anyStone) return [{ r: 7, c: 7 }];
  return cells;
}

function pickIndex(length, rng) {
  if (length <= 1) return 0;
  return Math.min(length - 1, Math.floor(rng() * length));
}

function weakScore(board, r, c, player) {
  let score = centerBias(r, c) * 0.4;
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (!inBounds(nr, nc)) continue;
      if (board[nr][nc] === player) score += 4;
      else if (board[nr][nc] !== EMPTY) score += 3;
    }
  }
  return score;
}

function chooseEasy(board, player, cells, rng) {
  const wins = cells.filter((cell) => patternScore(board, cell.r, cell.c, player) >= WIN_SCORE);
  const blocks = cells.filter((cell) => patternScore(board, cell.r, cell.c, other(player)) >= WIN_SCORE);
  if (wins.length && rng() < 0.55) {
    const cell = wins[pickIndex(wins.length, rng)];
    return { r: cell.r, c: cell.c };
  }
  if (blocks.length && rng() < 0.58) {
    const cell = blocks[pickIndex(blocks.length, rng)];
    return { r: cell.r, c: cell.c };
  }
  if (rng() < 0.28) {
    const cell = cells[pickIndex(cells.length, rng)];
    return { r: cell.r, c: cell.c };
  }
  const ranked = cells
    .map((cell) => ({
      r: cell.r,
      c: cell.c,
      score: weakScore(board, cell.r, cell.c, player) + rng() * 8,
    }))
    .sort((a, b) => b.score - a.score || a.r - b.r || a.c - b.c);
  const pool = ranked.slice(0, Math.min(6, ranked.length));
  const cell = pool[pickIndex(pool.length, rng)];
  return { r: cell.r, c: cell.c };
}

function chooseComputerMove(board, player, difficulty, rng = Math.random) {
  const cells = candidates(board);
  if (!cells.length) return null;
  if (difficulty !== 'normal') return chooseEasy(board, player, cells, rng);

  const scored = cells
    .map((cell) => ({
      r: cell.r,
      c: cell.c,
      score: cellScore(board, cell.r, cell.c, player),
    }))
    .sort((a, b) => b.score - a.score || a.r - b.r || a.c - b.c);
  const best = scored[0].score;
  const floor = best >= WIN_SCORE ? best : best * 0.92;
  const pool = scored.filter((cell) => cell.score >= floor - 0.001);
  const cell = pool[pickIndex(pool.length, rng)];
  return { r: cell.r, c: cell.c };
}

const api = {
  SIZE,
  EMPTY,
  BLACK,
  WHITE,
  createGame,
  place,
  undo,
  findWinningLines,
  chooseComputerMove,
  isBoardFull,
  other,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}
if (typeof window !== 'undefined') {
  window.Gomoku = api;
}
