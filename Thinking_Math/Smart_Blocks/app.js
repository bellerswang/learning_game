document.addEventListener('DOMContentLoaded', () => {

    // ─── ELEMENTS ────────────────────────────────────────────────
    const workspace    = document.getElementById('workspace');
    const fab          = document.getElementById('fab');
    const panel        = document.getElementById('tool-panel');
    const overlay      = document.getElementById('panel-overlay');
    const eqDisplay    = document.getElementById('equation-display');
    const btnNewQ      = document.getElementById('btn-new-question');
    const btnClear     = document.getElementById('btn-clear');
    const btnZoneBox   = document.getElementById('btn-zone-box');
    const btnZoneArray = document.getElementById('btn-zone-array');
    const btnZoneHoops = document.getElementById('btn-zone-hoops');
    const subtractHint = document.getElementById('subtract-hint');
    const removeCounter= document.getElementById('remove-counter');
    const removeCount  = document.getElementById('remove-count');
    const toggles      = document.querySelectorAll('.toggle');
    const views        = document.querySelectorAll('.view');
    const spawnBtns    = document.querySelectorAll('.spawn-btn');

    let zIndex = 10;
    let spawnRow = { rod: 0, dot: 0 };
    let isSubtractMode = false;

    // ─── FAB + PANEL ─────────────────────────────────────────────
    function openPanel() {
        panel.classList.add('open');
        overlay.classList.add('visible');
        fab.classList.add('open');
        fab.setAttribute('aria-expanded', 'true');
    }
    function closePanel() {
        panel.classList.remove('open');
        overlay.classList.remove('visible');
        fab.classList.remove('open');
        fab.setAttribute('aria-expanded', 'false');
    }

    fab.addEventListener('click', () => fab.classList.contains('open') ? closePanel() : openPanel());
    overlay.addEventListener('click', closePanel);

    // Close panel after spawning so child sees the stage
    spawnBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const type  = btn.dataset.type;
            const count = parseInt(btn.dataset.count);
            for (let i = 0; i < count; i++) {
                setTimeout(() => spawnManipulative(type), i * 60);
            }
            closePanel();
        });
    });

    btnClear.addEventListener('click', () => { clearStage(); closePanel(); });
    btnZoneBox.addEventListener('click',   () => { generateResultBox();       closePanel(); });
    btnZoneArray.addEventListener('click', () => { generateArrayGrid(3, 5);   closePanel(); });
    btnZoneHoops.addEventListener('click', () => { generateHoops(3);          closePanel(); });

    // ─── VIEW TOGGLES ────────────────────────────────────────────
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggles.forEach(t => t.classList.remove('active'));
            toggle.classList.add('active');
            const id = 'view-' + toggle.dataset.view;
            views.forEach(v => v.classList.toggle('active', v.id === id));
        });
    });

    // ─── QUESTION GENERATOR ──────────────────────────────────────
    function generateQuestion() {
        const types = ['ADD', 'SUB', 'MISSING', 'HALF', 'DIV', 'MULT'];
        const type  = types[Math.floor(Math.random() * types.length)];
        let html = '';

        isSubtractMode = false;

        switch (type) {
            case 'ADD': {
                const a = rnd(10, 49), b = rnd(10, 39);
                html = eq(a, '+', b, '?');
                generateResultBox();
                break;
            }
            case 'SUB': {
                const a = rnd(30, 79), b = rnd(5, 25);
                html = eq(a, '−', b, '?');
                isSubtractMode = true;
                generateResultBox();
                break;
            }
            case 'MISSING': {
                const total = rnd(20, 60);
                const a = rnd(5, total - 10);
                html = `<span class="number">${a}</span><span class="operator">+</span><span class="unknown">?</span><span class="operator">=</span><span class="number">${total}</span>`;
                generateResultBox();
                break;
            }
            case 'HALF': {
                const val = rnd(2, 10) * 2;
                html = `<span class="operator">½ of</span><span class="number">${val}</span><span class="operator">=</span><span class="unknown">?</span>`;
                generateHoops(2);
                break;
            }
            case 'DIV': {
                const d = [2, 5, 10][Math.floor(Math.random() * 3)];
                const r = rnd(1, 5);
                html = eq(d * r, '÷', d, '?');
                generateHoops(d);
                break;
            }
            case 'MULT': {
                const a = [2, 5, 10][Math.floor(Math.random() * 3)];
                const b = rnd(2, 6);
                html = eq(a, '×', b, '?');
                generateArrayGrid(a, b);
                break;
            }
        }

        eqDisplay.innerHTML = html;
        updateSubtractUI();
    }

    function eq(a, op, b, ans) {
        const ansHtml = ans === '?' 
            ? `<span class="unknown">?</span>` 
            : `<span class="number">${ans}</span>`;
        return `<span class="number">${a}</span><span class="operator">${op}</span><span class="number">${b}</span><span class="operator">=</span>${ansHtml}`;
    }

    function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    function updateSubtractUI() {
        subtractHint.classList.toggle('hidden', !isSubtractMode);
        removeCounter.classList.toggle('hidden', !isSubtractMode);
        if (isSubtractMode) updateRemovedCount();
    }

    function updateRemovedCount() {
        const n = workspace.querySelectorAll('.manipulative.removed').length;
        removeCount.textContent = n;
    }

    // ─── CLEAR ───────────────────────────────────────────────────
    function clearStage() {
        workspace.querySelectorAll('.manipulative').forEach(m => m.remove());
        spawnRow = { rod: 0, dot: 0 };
        updateZoneCounters();
        updateRemovedCount();
    }

    // ─── SPAWN ───────────────────────────────────────────────────
    const DOT_W = 36, DOT_H = 36;
    const ROD_W = 34, ROD_H = 160;
    const PAD   = 16;

    function spawnManipulative(type, x = null, y = null) {
        const el = document.createElement('div');
        el.classList.add('manipulative', type);

        if (x === null) {
            if (type === 'rod') {
                const col = spawnRow.rod % 7;
                const row = Math.floor(spawnRow.rod / 7);
                x = PAD + col * (ROD_W + 12);
                y = PAD + row * (ROD_H + 12);
                spawnRow.rod++;
            } else {
                const col = spawnRow.dot % 10;
                const row = Math.floor(spawnRow.dot / 10);
                x = PAD + col * (DOT_W + 10);
                y = PAD + 20 + row * (DOT_H + 10);

                // Push dots below rods if rods are present
                const rodRows = Math.ceil(spawnRow.rod / 7);
                if (rodRows > 0) y += rodRows * (ROD_H + 12);
                spawnRow.dot++;
            }
        }

        el.style.left = `${x}px`;
        el.style.top  = `${y}px`;

        setupInteraction(el);
        workspace.appendChild(el);
        updateZoneCounters();
        return el;
    }

    // ─── INTERACTION: DRAG + LONG-PRESS-TO-REMOVE ────────────────
    let dragged = null, offsetX = 0, offsetY = 0, downX = 0, downY = 0;
    let longPressTimer = null;
    const LONG_PRESS_MS = 450;

    function setupInteraction(el) {

        el.addEventListener('pointerdown', e => {
            if (e.button !== 0 && e.pointerType === 'mouse') return;
            e.preventDefault();

            downX = e.clientX; downY = e.clientY;

            // Long press — mark as removed (subtraction mode & general)
            longPressTimer = setTimeout(() => {
                el.classList.remove('pressing');
                el.classList.toggle('removed');
                updateRemovedCount();
                updateZoneCounters();
                longPressTimer = null;
            }, LONG_PRESS_MS);

            el.classList.add('pressing');

            dragged = el;
            zIndex++;
            el.style.zIndex = zIndex;
            el.classList.add('dragging');
            el.setPointerCapture(e.pointerId);

            const rect = el.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
        });

        el.addEventListener('pointermove', e => {
            // Cancel long press if moved
            if (longPressTimer && Math.hypot(e.clientX - downX, e.clientY - downY) > 8) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
                el.classList.remove('pressing');
            }

            if (dragged !== el) return;

            const wsRect = workspace.getBoundingClientRect();
            let nx = e.clientX - wsRect.left - offsetX;
            let ny = e.clientY - wsRect.top  - offsetY;
            nx = Math.max(0, Math.min(nx, wsRect.width  - el.offsetWidth));
            ny = Math.max(0, Math.min(ny, wsRect.height - el.offsetHeight));
            el.style.left = `${nx}px`;
            el.style.top  = `${ny}px`;
            updateZoneCounters();
        });

        const release = e => {
            if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
            el.classList.remove('pressing');

            if (dragged !== el) return;
            dragged = null;
            el.classList.remove('dragging');
            el.releasePointerCapture(e.pointerId);

            const dist = Math.hypot(e.clientX - downX, e.clientY - downY);

            // Tap on rod = shatter (only if not removed)
            if (dist < 8) {
                if (el.classList.contains('rod') && !el.classList.contains('removed')) {
                    shatterRod(el);
                }
                return;
            }

            // Drag of dot = check fusing (only if not removed)
            if (el.classList.contains('dot') && !el.classList.contains('removed')) {
                checkFusing(el);
            }
            updateZoneCounters();
        };

        el.addEventListener('pointerup',    release);
        el.addEventListener('pointercancel', release);
    }

    // ─── FUSING ──────────────────────────────────────────────────
    function checkFusing(dropped) {
        const dots = [...workspace.querySelectorAll('.dot:not(.removed)')];
        if (dots.length < 10) return;

        const RADIUS = 130;
        const nearby = dots
            .filter(d => dist2d(dropped, d) < RADIUS)
            .sort((a, b) => dist2d(dropped, a) - dist2d(dropped, b));

        if (nearby.length >= 10) {
            const ten = nearby.slice(0, 10);
            const nx = parseFloat(dropped.style.left);
            const ny = parseFloat(dropped.style.top) - 75;
            ten.forEach(d => d.remove());
            spawnRow.dot -= 10;
            if (spawnRow.dot < 0) spawnRow.dot = 0;
            const rod = spawnManipulative('rod', nx, ny);
            rod.classList.add('fuse-animation');
            setTimeout(() => { rod.classList.remove('fuse-animation'); updateZoneCounters(); }, 600);
        }
    }

    // ─── SHATTERING ──────────────────────────────────────────────
    function shatterRod(rod) {
        const rect   = rod.getBoundingClientRect();
        const wsRect = workspace.getBoundingClientRect();
        const cx     = rect.left - wsRect.left + rect.width  / 2;
        const cy     = rect.top  - wsRect.top  + rect.height / 2;
        rod.remove();

        for (let i = 0; i < 10; i++) {
            const angle  = (i / 10) * Math.PI * 2;
            const radius = 35 + Math.random() * 40;
            const dot    = spawnManipulative('dot', cx + Math.cos(angle) * radius - 18, cy + Math.sin(angle) * radius - 18);
            dot.classList.add('shatter-animation');
            setTimeout(() => dot.classList.remove('shatter-animation'), 600);
        }
        updateZoneCounters();
    }

    // ─── ZONES ───────────────────────────────────────────────────
    function clearZones() { workspace.querySelectorAll('.zone').forEach(z => z.remove()); }

    function generateResultBox() {
        clearZones();
        const box = document.createElement('div');
        box.className = 'zone result-box';
        box.innerHTML = `<div class="zone-label">Result</div><div class="zone-count">0</div>`;
        workspace.appendChild(box);
        updateZoneCounters();
    }

    function generateArrayGrid(rows, cols) {
        clearZones();
        const grid = document.createElement('div');
        grid.className = 'zone array-grid';
        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        for (let i = 0; i < rows * cols; i++) {
            const cell = document.createElement('div');
            cell.className = 'array-cell';
            grid.appendChild(cell);
        }
        workspace.appendChild(grid);
        updateZoneCounters();
    }

    function generateHoops(count) {
        clearZones();
        const wsRect = workspace.getBoundingClientRect();
        const size   = count > 5 ? 110 : 160;
        const spacing = wsRect.width / (count + 1);
        for (let i = 0; i < count; i++) {
            const hoop = document.createElement('div');
            hoop.className = 'zone hoop';
            hoop.style.cssText = `width:${size}px;height:${size}px;left:${spacing*(i+1)-(size/2)}px;top:${wsRect.height/2-(size/2)}px`;
            hoop.innerHTML = `<div class="hoop-counter">0</div>`;
            workspace.appendChild(hoop);
        }
        updateZoneCounters();
    }

    function updateZoneCounters() {
        // Helper: only count non-removed blocks
        const active = sel => [...workspace.querySelectorAll(sel + ':not(.removed)')];

        const box = workspace.querySelector('.result-box');
        if (box) {
            const r = box.getBoundingClientRect();
            let total = 0;
            active('.manipulative').forEach(m => {
                if (inside(m.getBoundingClientRect(), r))
                    total += m.classList.contains('rod') ? 10 : 1;
            });
            box.querySelector('.zone-count').textContent = total;
        }

        workspace.querySelectorAll('.hoop').forEach(hoop => {
            const r  = hoop.getBoundingClientRect();
            const cx = r.left + r.width / 2, cy = r.top + r.height / 2, rad = r.width / 2;
            let total = 0;
            active('.manipulative').forEach(m => {
                const mr = m.getBoundingClientRect();
                if (Math.hypot(mr.left + mr.width/2 - cx, mr.top + mr.height/2 - cy) < rad)
                    total += m.classList.contains('rod') ? 10 : 1;
            });
            hoop.querySelector('.hoop-counter').textContent = total;
        });

        const grid = workspace.querySelector('.array-grid');
        if (grid) {
            const cells = [...grid.querySelectorAll('.array-cell')];
            cells.forEach(c => c.classList.remove('filled'));
            active('.dot').forEach(dot => {
                const dr = dot.getBoundingClientRect();
                const dcx = dr.left + dr.width/2, dcy = dr.top + dr.height/2;
                cells.forEach(cell => {
                    const cr = cell.getBoundingClientRect();
                    if (dcx >= cr.left && dcx <= cr.right && dcy >= cr.top && dcy <= cr.bottom)
                        cell.classList.add('filled');
                });
            });
        }

        if (isSubtractMode) updateRemovedCount();
    }

    // ─── HELPERS ─────────────────────────────────────────────────
    function dist2d(a, b) {
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        return Math.hypot(ra.left+ra.width/2 - (rb.left+rb.width/2), ra.top+ra.height/2 - (rb.top+rb.height/2));
    }
    function inside(er, zr) {
        const cx = er.left + er.width/2, cy = er.top + er.height/2;
        return cx >= zr.left && cx <= zr.right && cy >= zr.top && cy <= zr.bottom;
    }

    // ─── INIT ────────────────────────────────────────────────────
    btnNewQ.addEventListener('click', () => { clearStage(); generateQuestion(); });
    generateQuestion();
});
