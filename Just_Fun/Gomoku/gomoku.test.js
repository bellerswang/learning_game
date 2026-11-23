const test = require('node:test');
const assert = require('node:assert/strict');
const {
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
} = require('./gomoku.js');

function fill(game, moves) {
  for (const [r, c] of moves) {
    const result = place(game, r, c);
    assert.equal(result.ok, true, result.reason);
  }
}

test('a new board is 15 by 15 and black moves first', () => {
  const game = createGame();
  assert.equal(game.board.length, SIZE);
  assert.equal(game.board[0].length, SIZE);
  assert.equal(SIZE, 15);
  assert.ok(game.board.every((row) => row.every((cell) => cell === EMPTY)));
  assert.equal(game.turn, BLACK);
  assert.equal(game.winner, null);
  assert.equal(game.draw, false);
});

test('stones land on intersections and occupied points are rejected', () => {
  const game = createGame();
  assert.equal(place(game, 7, 7).ok, true);
  assert.equal(game.board[7][7], BLACK);
  assert.equal(game.turn, WHITE);
  assert.equal(place(game, 7, 7).ok, false);
  assert.equal(place(game, -1, 0).ok, false);
  assert.equal(place(game, 15, 0).ok, false);
});

test('five or more in a row wins on every axis', () => {
  const cases = [
    {
      name: 'horizontal',
      moves: [[7, 3], [8, 3], [7, 4], [8, 4], [7, 5], [8, 5], [7, 6], [8, 6], [7, 7]],
      winner: BLACK,
    },
    {
      name: 'vertical',
      moves: [[3, 7], [3, 8], [4, 7], [4, 8], [5, 7], [5, 8], [6, 7], [6, 8], [7, 7]],
      winner: BLACK,
    },
    {
      name: 'diagonal down',
      moves: [[2, 2], [2, 3], [3, 3], [3, 4], [4, 4], [4, 5], [5, 5], [5, 6], [6, 6]],
      winner: BLACK,
    },
    {
      name: 'diagonal up',
      moves: [[6, 2], [5, 2], [5, 3], [4, 3], [4, 4], [3, 4], [3, 5], [2, 5], [2, 6]],
      winner: BLACK,
    },
    {
      name: 'overline of six',
      moves: [[0, 0], [8, 8], [0, 1], [8, 9], [0, 3], [9, 8], [0, 4], [9, 9], [0, 5], [10, 8], [0, 2]],
      winner: BLACK,
    },
  ];

  for (const sample of cases) {
    const game = createGame();
    fill(game, sample.moves);
    assert.equal(game.winner, sample.winner, sample.name);
    assert.ok(game.winLine.length >= 5, sample.name);
    if (sample.name === 'overline of six') assert.equal(game.winLine.length, 6);
    assert.equal(place(game, 10, 10).ok, false, sample.name);
  }
});

test('four in a row is not a win', () => {
  const game = createGame();
  fill(game, [[7, 3], [8, 0], [7, 4], [8, 1], [7, 5], [8, 2], [7, 6]]);
  assert.equal(game.winner, null);
  assert.equal(game.turn, WHITE);
});

test('a full board with no five is a draw', () => {
  const game = createGame();
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      // Two-row bands keep every run shorter than five.
      const band = Math.floor(r / 2);
      game.board[r][c] = (c + band) % 2 === 0 ? BLACK : WHITE;
    }
  }
  assert.equal(isBoardFull(game.board), true);
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      assert.equal(findWinningLines(game.board, r, c, game.board[r][c]).length, 0);
    }
  }
  game.board[0][0] = EMPTY;
  game.history = [];
  game.turn = BLACK;
  place(game, 0, 0);
  assert.equal(game.draw, true);
  assert.equal(game.winner, null);
});

test('two-player undo removes only the last stone', () => {
  const game = createGame({ mode: 'pvp' });
  place(game, 7, 7);
  place(game, 7, 8);
  undo(game);
  assert.equal(game.board[7][8], EMPTY);
  assert.equal(game.board[7][7], BLACK);
  assert.equal(game.turn, WHITE);
  undo(game);
  assert.equal(game.board[7][7], EMPTY);
  assert.equal(game.turn, BLACK);
  assert.equal(undo(game).ok, false);
});

test('versus-computer undo removes the player and computer stones together', () => {
  const game = createGame({ mode: 'cpu', humanColor: BLACK });
  place(game, 7, 7);
  place(game, 7, 8);
  place(game, 8, 7);
  place(game, 8, 8);
  const result = undo(game);
  assert.equal(result.ok, true);
  assert.equal(result.removed, 2);
  assert.equal(game.board[8][7], EMPTY);
  assert.equal(game.board[8][8], EMPTY);
  assert.equal(game.board[7][7], BLACK);
  assert.equal(game.turn, BLACK);

  const whiteHuman = createGame({ mode: 'cpu', humanColor: WHITE });
  place(whiteHuman, 7, 7);
  undo(whiteHuman);
  assert.equal(whiteHuman.board[7][7], EMPTY);
  assert.equal(whiteHuman.turn, BLACK);
});

test('undo after a win lets the game continue', () => {
  const game = createGame({ mode: 'cpu', humanColor: BLACK });
  fill(game, [[7, 0], [0, 0], [7, 1], [0, 1], [7, 2], [0, 2], [7, 3], [0, 3], [7, 4]]);
  assert.equal(game.winner, BLACK);
  undo(game);
  assert.equal(game.winner, null);
  assert.equal(game.winLine, null);
  assert.equal(game.turn, BLACK);
  assert.equal(game.board[7][4], EMPTY);
  assert.equal(game.board[0][3], WHITE);
});

test('normal computer takes a win and blocks a five', () => {
  const attack = createGame();
  fill(attack, [[7, 3], [0, 0], [7, 4], [0, 1], [7, 5], [0, 2], [7, 6]]);
  attack.turn = BLACK;
  const winMove = chooseComputerMove(attack.board, BLACK, 'normal', () => 0);
  assert.deepEqual(winMove, { r: 7, c: 2 });

  const defend = createGame();
  fill(defend, [[7, 3], [0, 0], [7, 4], [0, 1], [7, 5], [0, 2], [7, 6]]);
  defend.turn = WHITE;
  const block = chooseComputerMove(defend.board, WHITE, 'normal', () => 0);
  assert.ok(block.r === 7 && (block.c === 2 || block.c === 7));
});

test('normal computer answers an open three by extending or blocking', () => {
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
  board[7][6] = BLACK;
  board[7][7] = BLACK;
  board[7][8] = BLACK;
  const move = chooseComputerMove(board, WHITE, 'normal', () => 0);
  assert.equal(move.r, 7);
  assert.ok(move.c === 5 || move.c === 9);
});

test('easy computer sometimes misses a block', () => {
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
  for (let c = 3; c <= 6; c += 1) board[7][c] = BLACK;
  let misses = 0;
  const trials = 40;
  for (let i = 0; i < trials; i += 1) {
    let seed = 1000 + i * 17;
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const move = chooseComputerMove(board, WHITE, 'easy', rng);
    const blocked = move.r === 7 && (move.c === 2 || move.c === 7);
    if (!blocked) misses += 1;
  }
  assert.ok(misses >= 8, `expected easy misses, got ${misses}/${trials}`);
  assert.ok(misses < trials, 'easy should still block some of the time');
});
