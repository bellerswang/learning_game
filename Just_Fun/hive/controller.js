class HiveController {
    constructor(engine, renderer) {
        this.engine = engine;
        this.renderer = renderer;
        this.selectedHandPiece = null;
        this.selectedBoardHex = null;
        this.aiThinking = false;

        this.pieceDescriptions = {
            [PieceType.QUEEN]: { title: "Queen Bee (蜂后)", desc: "Moves 1 space only. Must be surrounded to lose. (每次移动1格，被包围则输)" },
            [PieceType.ANT]: { title: "Soldier Ant (兵蚁)", desc: "Moves anywhere around the outside of the hive. (沿蜂巢边缘任意移动)" },
            [PieceType.SPIDER]: { title: "Spider (蜘蛛)", desc: "Moves exactly 3 spaces around the hive. (沿蜂巢边缘正好移动3格)" },
            [PieceType.BEETLE]: { title: "Beetle (甲虫)", desc: "Moves 1 space, can climb on top of other pieces. (移动1格，可爬上其他棋子)" },
            [PieceType.GRASSHOPPER]: { title: "Grasshopper (蚱蜢)", desc: "Jumps over pieces in a straight line. (沿直线跳过其他棋子)" },
            [PieceType.MOSQUITO]: { title: "Mosquito (蚊子)", desc: "Copies movement of any piece it touches. (复制接触到的棋子的移动能力)" },
            [PieceType.LADYBUG]: { title: "Ladybug (瓢虫)", desc: "Moves 3 spaces: 2 on top, 1 down. (移动3格：2格在上面，1格下来)" },
            [PieceType.PILLBUG]: { title: "Pillbug (潮虫)", desc: "Moves 1 space. Can move adjacent pieces (not implemented UI). (移动1格，可移动相邻棋子)" }
        };

        this.initInput();
        this.updateUI();
    }

    initInput() {
        // Mouse Click
        this.renderer.canvas.addEventListener('mousedown', (e) => {
            if (this.aiThinking) return;
            const rect = this.renderer.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleCanvasClick(x, y);
        });

        // Mouse Wheel Zoom
        this.renderer.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.hideTooltip();
            const delta = -Math.sign(e.deltaY) * 0.1;
            this.renderer.setZoom(this.renderer.zoom + delta);
        }, { passive: false });

        // Touch Click & Zoom logic
        let lastTouchDist = 0;

        this.renderer.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                // Pinch start
                e.preventDefault();
                this.hideTooltip();
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                lastTouchDist = Math.sqrt(dx * dx + dy * dy);
            } else if (e.touches.length === 1) {
                // Potential tap
            }
        }, { passive: false });

        this.renderer.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                // Pinch move
                e.preventDefault();
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (lastTouchDist > 0) {
                    const ratio = dist / lastTouchDist;
                    // Sensitivity adjustment
                    const delta = (ratio - 1) * 1.5;
                    this.renderer.setZoom(this.renderer.zoom + delta);
                }
                lastTouchDist = dist;
            }
        }, { passive: false });

        this.renderer.canvas.addEventListener('touchend', (e) => {
            // Reset if fingers lifted
            if (e.touches.length < 2) lastTouchDist = 0;
            if (this.aiThinking) return;

            // Tap detection
            // We use changedTouches to see what lifted.
            if (e.changedTouches.length === 1 && !lastTouchDist) {
                e.preventDefault();
                const touch = e.changedTouches[0];
                const rect = this.renderer.canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                this.handleCanvasClick(x, y);
            }
        }, { passive: false });

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) restartBtn.addEventListener('click', () => location.reload());

        const playAgain = document.getElementById('play-again-btn');
        if (playAgain) playAgain.addEventListener('click', () => location.reload());
    }

    handleCanvasClick(x, y) {
        if (!this.engine.whiteToMove) return;

        const hex = this.renderer.pixelToHex(x, y);
        const key = `${hex.q},${hex.r}`;
        const existingPiece = this.engine.board.get(key);

        // 1. Place
        if (this.selectedHandPiece) {
            if (this.engine.placePiece(hex.q, hex.r, this.selectedHandPiece.type, 'white')) {
                // Drop animation
                this.renderer.animateDrop(`${hex.q},${hex.r}`, hex.q, hex.r);

                this.selectedHandPiece = null;
                this.hideTooltip();
                this.updateUI();
                // animateDrop handles loop starting
            }
            return;
        }

        // 2. Select Own & Show Tooltip
        if (existingPiece && existingPiece.color === 'white') {
            this.selectedBoardHex = hex;
            this.renderer.selectedHex = hex;
            const moves = this.engine.getValidMoves(hex.q, hex.r);
            this.renderer.validMoves = moves;
            this.showTooltip(existingPiece, x, y);
            this.renderer.draw();
            return;
        }

        // 3. Move Selected
        if (this.selectedBoardHex) {
            const fromQ = this.selectedBoardHex.q;
            const fromR = this.selectedBoardHex.r;

            if (this.engine.movePiece(fromQ, fromR, hex.q, hex.r)) {
                // Success! Trigger animation
                this.renderer.animateMove(`${hex.q},${hex.r}`, fromQ, fromR, hex.q, hex.r);

                this.selectedBoardHex = null;
                this.renderer.selectedHex = null;
                this.renderer.validMoves = [];
                this.hideTooltip();
                this.updateUI();
                // animateMove handles loop starting
            } else {
                if (existingPiece) {
                    // Clicked another piecce
                    this.showTooltip(existingPiece, x, y);
                    if (existingPiece.color === 'white') {
                        this.selectedBoardHex = hex;
                        this.renderer.selectedHex = hex;
                        const moves = this.engine.getValidMoves(hex.q, hex.r);
                        this.renderer.validMoves = moves;
                    } else {
                        this.selectedBoardHex = null; // Can't select enemy
                        this.renderer.selectedHex = null;
                        this.renderer.validMoves = [];
                    }
                    this.renderer.draw();
                } else {
                    this.deselect();
                }
            }
        } else {
            // No selection, clicked piece?
            if (existingPiece) {
                this.showTooltip(existingPiece, x, y);
            } else {
                this.deselect();
            }
        }
    }

    deselect() {
        this.selectedBoardHex = null;
        this.renderer.selectedHex = null;
        this.renderer.validMoves = [];
        this.hideTooltip();
        this.renderer.draw();
    }

    selectHandPiece(type) {
        if (!this.engine.whiteToMove) return;
        this.selectedHandPiece = { type, color: 'white' };
        this.selectedBoardHex = null;
        this.renderer.selectedHex = null;
        this.renderer.validMoves = [];
        this.renderer.draw();

        this.hideTooltip();
        this.updateUI();
    }

    showTooltip(piece, x, y) {
        const tooltip = document.getElementById('tooltip');
        if (!tooltip) return;

        const info = this.pieceDescriptions[piece.type];
        if (info) {
            tooltip.innerHTML = `<h4>${info.title}</h4><p>${info.desc}</p>`;
            tooltip.classList.remove('hidden');

            const canvasRect = this.renderer.canvas.getBoundingClientRect();
            // Position above piece
            const screenX = canvasRect.left + x;
            const screenY = canvasRect.top + y - 80;

            tooltip.style.left = `${screenX}px`;
            tooltip.style.top = `${screenY}px`;
        }
    }

    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) tooltip.classList.add('hidden');
    }

    updateUI() {
        const statusEl = document.getElementById('status');
        const turnColor = this.engine.whiteToMove ? "White" : "Black";
        statusEl.innerText = `${turnColor}'s Turn (Turn ${Math.ceil(this.engine.turn / 2)})`;
        statusEl.style.color = this.engine.whiteToMove ? '#fff' : '#aaa';

        if (this.engine.winner) {
            statusEl.innerText = `GAME OVER! ${this.engine.winner.toUpperCase()} WINS!`;
            statusEl.style.color = '#e74c3c';

            const overlay = document.getElementById('victory-overlay');
            if (overlay) {
                document.getElementById('winner-text').innerText = `${this.engine.winner.toUpperCase()} Wins!`;
                overlay.classList.remove('hidden');
            }
            return;
        }

        this.renderHand('player-pieces', 'white');
        this.renderHand('ai-pieces', 'black');

        if (!this.engine.whiteToMove) {
            statusEl.innerText += " (Thinking...)";
            if (!this.aiThinking && window.game && window.game.ai) {
                this.aiThinking = true;
                setTimeout(() => {
                    window.game.ai.makeMove((moveDetails) => {
                        this.aiThinking = false;

                        if (moveDetails && moveDetails.type === 'move') {
                            this.renderer.animateMove(
                                `${moveDetails.toQ},${moveDetails.toR}`,
                                moveDetails.fromQ, moveDetails.fromR,
                                moveDetails.toQ, moveDetails.toR
                            );
                        } else if (moveDetails && moveDetails.type === 'place') {
                            this.renderer.animateDrop(
                                `${moveDetails.q},${moveDetails.r}`,
                                moveDetails.q, moveDetails.r
                            );
                        } else {
                            this.renderer.draw();
                        }

                        this.updateUI();
                    });
                }, 100);
            }
        }
    }

    renderHand(containerId, color) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        const hand = this.engine.hands[color];
        Object.keys(hand).forEach(type => {
            const count = hand[type];
            if (count > 0) {
                const btn = document.createElement('div');
                btn.className = 'piece-btn';
                btn.innerText = `${this.renderer.pieceSymbols[type]}${count > 1 ? count : ''}`;
                btn.onclick = () => { if (color === 'white') this.selectHandPiece(type); };
                if (this.selectedHandPiece && this.selectedHandPiece.type === type && color === 'white') btn.classList.add('selected');
                container.appendChild(btn);
            }
        });
    }
}
