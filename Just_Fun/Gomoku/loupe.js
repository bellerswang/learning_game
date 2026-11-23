// Geometry for the touch magnifier. No DOM, so the page and the Node tests share it.
// Wrapped so this classic script does not clash with other top-level names on the page.
(function () {
function cellFromPoint(x, y, rect, size) {
  if (!rect || rect.width <= 0 || rect.height <= 0 || size <= 0) return null;
  if (x < rect.left || y < rect.top || x > rect.right || y > rect.bottom) return null;
  const c = Math.floor(((x - rect.left) / rect.width) * size);
  const r = Math.floor(((y - rect.top) / rect.height) * size);
  return {
    r: Math.min(size - 1, Math.max(0, r)),
    c: Math.min(size - 1, Math.max(0, c)),
  };
}

function edgeInsets(margin) {
  if (typeof margin === 'number') {
    return { top: margin, right: margin, bottom: margin, left: margin };
  }
  return {
    top: margin.top || 0,
    right: margin.right || 0,
    bottom: margin.bottom || 0,
    left: margin.left || 0,
  };
}

function placeLoupe({ x, y, size, gap, vw, vh, margin }) {
  const edge = edgeInsets(margin);
  let left = x - size / 2;
  const minLeft = edge.left;
  const maxLeft = Math.max(minLeft, vw - size - edge.right);
  left = Math.min(Math.max(left, minLeft), maxLeft);
  const minTop = edge.top;
  const maxTop = Math.max(minTop, vh - size - edge.bottom);
  let top = y - size - gap;
  if (top < minTop) {
    const squeezed = y - size - 4;
    top = squeezed >= minTop ? squeezed : y + gap;
  }
  top = Math.min(Math.max(top, minTop), maxTop);
  return { left, top };
}

function magnification(cellPx, loupePx) {
  if (!(cellPx > 0) || !(loupePx > 0)) return 1.6;
  const wanted = loupePx / (cellPx * 2.8);
  return Math.max(1.6, Math.min(3, wanted));
}

const api = { cellFromPoint, placeLoupe, magnification };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}
if (typeof window !== 'undefined') {
  window.GomokuLoupe = api;
}
})();
