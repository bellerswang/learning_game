document.addEventListener('DOMContentLoaded', () => {
    // --- View Toggles ---
    const toggles = document.querySelectorAll('.toggle');
    const views = document.querySelectorAll('.view');

    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggles.forEach(t => t.classList.remove('active'));
            toggle.classList.add('active');

            const targetViewId = 'view-' + toggle.dataset.view;
            views.forEach(view => {
                view.classList.remove('active');
                if (view.id === targetViewId) {
                    view.classList.add('active');
                }
            });
        });
    });

    // --- Workspace & Manipulatives Spawning ---
    const workspace = document.getElementById('workspace');
    const btnClear = document.getElementById('btn-clear');
    const btnNewQuestion = document.getElementById('btn-new-question');
    const spawnBtns = document.querySelectorAll('.spawn-btn');
    
    // Zone buttons
    const btnZoneBox = document.getElementById('btn-zone-box');
    const btnZoneArray = document.getElementById('btn-zone-array');
    const btnZoneHoops = document.getElementById('btn-zone-hoops');

    let zIndexCounter = 1;
    let spawnOrderRod = 0;
    let spawnOrderDot = 0;

    btnNewQuestion.addEventListener('click', () => {
        generateQuestion();
        clearStage();
    });

    spawnBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const count = parseInt(btn.dataset.count);
            for(let i = 0; i < count; i++) {
                setTimeout(() => {
                    spawnManipulative(type);
                }, i * 50);
            }
        });
    });

    btnClear.addEventListener('click', clearStage);

    function clearStage() {
        workspace.querySelectorAll('.manipulative').forEach(m => m.remove());
        spawnOrderRod = 0;
        spawnOrderDot = 0;
        updateZoneCounters();
    }

    function generateQuestion() {
        const types = ['ADD', 'SUB', 'MISSING', 'HALF', 'DIV', 'MULT'];
        const type = types[Math.floor(Math.random() * types.length)];
        let html = '';
        
        switch(type) {
            case 'ADD': {
                const a = Math.floor(Math.random() * 40) + 10;
                const b = Math.floor(Math.random() * 40) + 10;
                html = `<span class="number">${a}</span> <span class="operator">+</span> <span class="number">${b}</span> <span class="operator">=</span> <span class="unknown">?</span>`;
                generateResultBox();
                break;
            }
            case 'SUB': {
                const a = Math.floor(Math.random() * 50) + 30;
                const b = Math.floor(Math.random() * 20) + 5;
                html = `<span class="number">${a}</span> <span class="operator">-</span> <span class="number">${b}</span> <span class="operator">=</span> <span class="unknown">?</span>`;
                generateResultBox();
                break;
            }
            case 'MISSING': {
                const total = Math.floor(Math.random() * 40) + 20;
                const a = Math.floor(Math.random() * (total - 10)) + 5;
                html = `<span class="number">${a}</span> <span class="operator">+</span> <span class="unknown">?</span> <span class="operator">=</span> <span class="number">${total}</span>`;
                generateResultBox();
                break;
            }
            case 'HALF': {
                const even = (Math.floor(Math.random() * 10) + 1) * 2;
                html = `<span class="operator">½ of</span> <span class="number">${even}</span> <span class="operator">=</span> <span class="unknown">?</span>`;
                generateHoops(2);
                break;
            }
            case 'DIV': {
                const divisors = [2, 5, 10];
                const d = divisors[Math.floor(Math.random() * divisors.length)];
                const result = Math.floor(Math.random() * 6) + 1;
                const a = d * result;
                html = `<span class="number">${a}</span> <span class="operator">÷</span> <span class="number">${d}</span> <span class="operator">=</span> <span class="unknown">?</span>`;
                generateHoops(d);
                break;
            }
            case 'MULT': {
                const factors = [2, 5, 10];
                const a = factors[Math.floor(Math.random() * factors.length)];
                const b = Math.floor(Math.random() * 5) + 2;
                html = `<span class="number">${a}</span> <span class="operator">×</span> <span class="number">${b}</span> <span class="operator">=</span> <span class="unknown">?</span>`;
                generateArrayGrid(a, b);
                break;
            }
        }
        
        document.querySelector('#equation-display').innerHTML = html;
    }

    btnZoneBox.addEventListener('click', () => generateResultBox());
    btnZoneArray.addEventListener('click', () => generateArrayGrid(3, 5));
    btnZoneHoops.addEventListener('click', () => generateHoops(3));

    function spawnManipulative(type, x = null, y = null) {
        const el = document.createElement('div');
        el.classList.add('manipulative', type);
        
        const width = 30;
        const height = type === 'rod' ? 150 : 30;

        let finalX, finalY;
        
        if (x !== null && y !== null) {
            finalX = x;
            finalY = y;
        } else {
            if (type === 'rod') {
                finalX = 40 + (spawnOrderRod % 8) * 45;
                finalY = 40 + Math.floor(spawnOrderRod / 8) * 170;
                spawnOrderRod++;
            } else {
                finalX = 40 + (spawnOrderDot % 10) * 40;
                finalY = 240 + Math.floor(spawnOrderDot / 10) * 40;
                spawnOrderDot++;
            }
        }

        el.style.left = `${finalX}px`;
        el.style.top = `${finalY}px`;
        
        setupDrag(el);
        workspace.appendChild(el);
        updateZoneCounters();
        return el;
    }

    // --- Zone Generators ---
    function clearZones() {
        workspace.querySelectorAll('.zone').forEach(z => z.remove());
    }

    function generateResultBox() {
        clearZones();
        const box = document.createElement('div');
        box.className = 'zone result-box';
        box.innerHTML = `
            <div class="zone-label">Result Box</div>
            <div class="hoop-counter">0</div>
        `;
        workspace.appendChild(box);
        updateZoneCounters();
    }

    function generateArrayGrid(rows, cols) {
        clearZones();
        const grid = document.createElement('div');
        grid.className = 'zone array-grid';
        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        
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
        const wsWidth = workspace.clientWidth;
        const wsHeight = workspace.clientHeight;
        
        // Dynamic hoop size based on count
        const size = count > 5 ? 120 : 180;
        const spacing = wsWidth / (count + 1);
        
        for (let i = 0; i < count; i++) {
            const hoop = document.createElement('div');
            hoop.className = 'zone hoop';
            hoop.style.width = `${size}px`;
            hoop.style.height = `${size}px`;
            hoop.innerHTML = `<div class="hoop-counter">0</div>`;
            
            hoop.style.left = `${spacing * (i + 1) - (size/2)}px`;
            hoop.style.top = `${wsHeight / 2 - (size/2)}px`;
            
            workspace.appendChild(hoop);
        }
        updateZoneCounters();
    }

    // --- Zone Logic ---
    function isInside(elRect, zoneRect) {
        const elCenterX = elRect.left + elRect.width / 2;
        const elCenterY = elRect.top + elRect.height / 2;
        return (
            elCenterX >= zoneRect.left &&
            elCenterX <= zoneRect.right &&
            elCenterY >= zoneRect.top &&
            elCenterY <= zoneRect.bottom
        );
    }

    function updateZoneCounters() {
        const resultBox = workspace.querySelector('.result-box');
        if (resultBox) {
            const rect = resultBox.getBoundingClientRect();
            let total = 0;
            workspace.querySelectorAll('.manipulative').forEach(m => {
                if (isInside(m.getBoundingClientRect(), rect)) {
                    total += m.classList.contains('rod') ? 10 : 1;
                }
            });
            resultBox.querySelector('.hoop-counter').textContent = total;
        }

        const hoops = workspace.querySelectorAll('.hoop');
        hoops.forEach(hoop => {
            const rect = hoop.getBoundingClientRect();
            const hCenterX = rect.left + rect.width / 2;
            const hCenterY = rect.top + rect.height / 2;
            const radius = rect.width / 2;

            let total = 0;
            workspace.querySelectorAll('.manipulative').forEach(m => {
                const mRect = m.getBoundingClientRect();
                const mCenterX = mRect.left + mRect.width / 2;
                const mCenterY = mRect.top + mRect.height / 2;
                const dist = Math.hypot(mCenterX - hCenterX, mCenterY - hCenterY);
                if (dist < radius) {
                    total += m.classList.contains('rod') ? 10 : 1;
                }
            });
            hoop.querySelector('.hoop-counter').textContent = total;
        });

        const grid = workspace.querySelector('.array-grid');
        if (grid) {
            const cells = grid.querySelectorAll('.array-cell');
            cells.forEach(cell => cell.classList.remove('filled'));
            
            workspace.querySelectorAll('.dot').forEach(dot => {
                const dotRect = dot.getBoundingClientRect();
                const dotCenterX = dotRect.left + dotRect.width / 2;
                const dotCenterY = dotRect.top + dotRect.height / 2;
                
                cells.forEach(cell => {
                    const cellRect = cell.getBoundingClientRect();
                    if (
                        dotCenterX >= cellRect.left && dotCenterX <= cellRect.right &&
                        dotCenterY >= cellRect.top && dotCenterY <= cellRect.bottom
                    ) {
                        cell.classList.add('filled');
                    }
                });
            });
        }
    }

    // --- Logic Engine: Fusing and Shattering ---
    function getDistance(el1, el2) {
        const rect1 = el1.getBoundingClientRect();
        const rect2 = el2.getBoundingClientRect();
        const center1 = { x: rect1.left + rect1.width/2, y: rect1.top + rect1.height/2 };
        const center2 = { x: rect2.left + rect2.width/2, y: rect2.top + rect2.height/2 };
        return Math.hypot(center1.x - center2.x, center1.y - center2.y);
    }

    function checkFusing(droppedDot) {
        const allDots = Array.from(workspace.querySelectorAll('.dot'));
        if (allDots.length < 10) return;

        const FUSE_RADIUS = 120;
        const nearbyDots = allDots.filter(dot => getDistance(droppedDot, dot) < FUSE_RADIUS);

        if (nearbyDots.length >= 10) {
            nearbyDots.sort((a, b) => getDistance(droppedDot, a) - getDistance(droppedDot, b));
            const dotsToFuse = nearbyDots.slice(0, 10);

            const newLeft = parseFloat(droppedDot.style.left) + 15 - 15;
            const newTop = parseFloat(droppedDot.style.top) + 15 - 75;

            dotsToFuse.forEach(dot => dot.remove());

            const rod = spawnManipulative('rod', newLeft, newTop);
            rod.classList.add('fuse-animation');
            setTimeout(() => {
                rod.classList.remove('fuse-animation');
                updateZoneCounters();
            }, 600);
        }
    }

    function shatterRod(rod) {
        const rect = rod.getBoundingClientRect();
        const workspaceRect = workspace.getBoundingClientRect();
        const centerX = rect.left - workspaceRect.left + rect.width/2;
        const centerY = rect.top - workspaceRect.top + rect.height/2;

        rod.remove();

        for(let i=0; i<10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const radius = Math.random() * 40 + 30;
            const dotLeft = centerX + Math.cos(angle) * radius - 15;
            const dotTop = centerY + Math.sin(angle) * radius - 15;
            
            const dot = spawnManipulative('dot', dotLeft, dotTop);
            dot.classList.add('shatter-animation');
            setTimeout(() => dot.classList.remove('shatter-animation'), 600);
        }
        updateZoneCounters();
    }

    // --- Drag and Drop Engine ---
    let draggedElement = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let pointerDownX = 0;
    let pointerDownY = 0;

    function setupDrag(element) {
        element.addEventListener('pointerdown', (e) => {
            if (e.button !== 0 && e.pointerType === 'mouse') return;
            draggedElement = element;
            pointerDownX = e.clientX;
            pointerDownY = e.clientY;
            zIndexCounter++;
            draggedElement.style.zIndex = zIndexCounter;
            draggedElement.classList.add('dragging');
            draggedElement.setPointerCapture(e.pointerId);
            const rect = draggedElement.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
        });

        element.addEventListener('pointermove', (e) => {
            if (!draggedElement || draggedElement !== element) return;
            const workspaceRect = workspace.getBoundingClientRect();
            let newX = e.clientX - workspaceRect.left - dragOffsetX;
            let newY = e.clientY - workspaceRect.top - dragOffsetY;
            newX = Math.max(0, Math.min(newX, workspaceRect.width - element.offsetWidth));
            newY = Math.max(0, Math.min(newY, workspaceRect.height - element.offsetHeight));
            draggedElement.style.left = `${newX}px`;
            draggedElement.style.top = `${newY}px`;
            updateZoneCounters();
        });

        const releaseDrag = (e) => {
            if (draggedElement === element) {
                draggedElement.classList.remove('dragging');
                draggedElement.releasePointerCapture(e.pointerId);
                const distMoved = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
                if (distMoved < 5) {
                    if (element.classList.contains('rod')) shatterRod(element);
                } else {
                    if (element.classList.contains('dot')) checkFusing(element);
                }
                updateZoneCounters();
                draggedElement = null;
            }
        };

        element.addEventListener('pointerup', releaseDrag);
        element.addEventListener('pointercancel', releaseDrag);
    }

    generateQuestion();
});
