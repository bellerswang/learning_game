const test = require('node:test');
const assert = require('node:assert/strict');
const { cellFromPoint, placeLoupe, magnification } = require('./loupe.js');

const grid = { left: 10, top: 20, right: 160, bottom: 170, width: 150, height: 150 };

test('a touch maps to the intersection cell underneath it', () => {
  assert.deepEqual(cellFromPoint(10, 20, grid, 15), { r: 0, c: 0 });
  assert.deepEqual(cellFromPoint(85, 95, grid, 15), { r: 7, c: 7 });
  assert.deepEqual(cellFromPoint(159, 30, grid, 15), { r: 1, c: 14 });
  assert.deepEqual(cellFromPoint(160, 170, grid, 15), { r: 14, c: 14 });
});

test('a touch outside the grid is not a move', () => {
  assert.equal(cellFromPoint(9.9, 40, grid, 15), null);
  assert.equal(cellFromPoint(160.1, 40, grid, 15), null);
  assert.equal(cellFromPoint(40, 19, grid, 15), null);
  assert.equal(cellFromPoint(40, 171, grid, 15), null);
});

test('the loupe sits above the finger and stays on screen', () => {
  const centered = placeLoupe({ x: 195, y: 500, size: 172, gap: 28, vw: 390, vh: 844, margin: 8 });
  assert.equal(centered.left, 195 - 86);
  assert.equal(centered.top, 500 - 172 - 28);
  assert.ok(centered.top + 172 <= 500);

  const leftEdge = placeLoupe({ x: 20, y: 500, size: 172, gap: 28, vw: 390, vh: 844, margin: 8 });
  assert.equal(leftEdge.left, 8);

  const rightEdge = placeLoupe({ x: 370, y: 500, size: 172, gap: 28, vw: 390, vh: 844, margin: 8 });
  assert.equal(rightEdge.left, 390 - 172 - 8);

  const topEdge = placeLoupe({ x: 195, y: 40, size: 172, gap: 28, vw: 390, vh: 844, margin: 8 });
  assert.equal(topEdge.top, 40 + 28);
  assert.ok(topEdge.top >= 40);

  const shortScreen = placeLoupe({ x: 500, y: 180, size: 168, gap: 32, vw: 844, vh: 390, margin: 8 });
  assert.ok(shortScreen.top + 168 <= 180, 'stay above the finger when the gap can shrink');
  assert.ok(shortScreen.top >= 8);

  const corner = placeLoupe({ x: 12, y: 18, size: 172, gap: 28, vw: 390, vh: 844, margin: 8 });
  assert.equal(corner.left, 8);
  assert.equal(corner.top, 18 + 28);
  assert.ok(corner.left >= 8);
  assert.ok(corner.top + 172 <= 844 - 8);
});

test('uneven safe margins are respected', () => {
  const placed = placeLoupe({
    x: 30,
    y: 80,
    size: 100,
    gap: 20,
    vw: 400,
    vh: 800,
    margin: { top: 47, right: 10, bottom: 34, left: 40 },
  });
  assert.ok(placed.left >= 40);
  assert.ok(placed.top >= 47);
  assert.ok(placed.left + 100 <= 400 - 10);
  assert.ok(placed.top + 100 <= 800 - 34);
});

test('magnification keeps a few crossings inside the lens', () => {
  const phone = magnification(22, 172);
  assert.ok(phone > 2 && phone <= 3);
  const tablet = magnification(48, 172);
  assert.ok(tablet >= 1.6 && tablet < phone);
});
