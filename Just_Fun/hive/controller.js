class HiveController {
    constructor(engine, renderer) {
        this.engine = engine;
        this.renderer = renderer;
        this.selectedHandPiece = null;
        this.selectedBoardHex = null;
        this.aiThinking = false;

        this.initInput();
        this.updateUI();
    }

    initInput() {
        this.renderer.canvas.addEventListener('mousedown', (e) => {
            if (this.aiThinking) return;
            const rect = this.renderer.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleCanvasClick(x, y);
        });

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) restartBtn.addEventListener('click', () => location.reload());

        // Add listener for dynamically shown Play Again button?
        // Or just add it now if element exists.
        const playAgain = document.getElementById('play-again-btn');
        if (playAgain) playAgain.addEventListener('click', () => location.reload());
    }

    handleCanvasClick(x, y) {
        if (!this.engine.whiteToMove) return;

        const hex = this.renderer.pixelToHex(x, y);
        // Rounding errors or mis-click logic should be handled by valid hex detection in Engine
        // But Controller orchestrates.

        const key = `${hex.q},${hex.r}`;
        const existingPiece = this.engine.board.get(key);

        // 1. Place
        if (this.selectedHandPiece) {
            if (this.engine.placePiece(hex.q, hex.r, this.selectedHandPiece.type, 'white')) {
                this.selectedHandPiece = null;
                this.updateUI();
                this.renderer.draw();
            }
            return;
        }

        // 2. Select Own
        if (existingPiece && existingPiece.color === 'white') {
            this.selectedBoardHex = hex;
            this.renderer.selectedHex = hex;
            const moves = this.engine.getValidMoves(hex.q, hex.r);
            this.renderer.validMoves = moves;
            this.renderer.draw();
            return;
        }

        // 3. Move Selected
        if (this.selectedBoardHex) {
            if (this.engine.movePiece(this.selectedBoardHex.q, this.selectedBoardHex.r, hex.q, hex.r)) {
                this.selectedBoardHex = null;
                this.renderer.selectedHex = null;
                this.renderer.validMoves = [];
                this.updateUI();
                this.renderer.draw();
            } else {
                if (existingPiece && existingPiece.color === 'white') {
                    this.selectedBoardHex = hex;
                    this.renderer.selectedHex = hex;
                    const moves = this.engine.getValidMoves(hex.q, hex.r);
                    this.renderer.validMoves = moves;
                    this.renderer.draw();
                } else {
                    this.selectedBoardHex = null;
                    this.renderer.selectedHex = null;
                    this.renderer.validMoves = [];
                    this.renderer.draw();
                }
            }
        }
    }

    selectHandPiece(type) {
        if (!this.engine.whiteToMove) return;
        this.selectedHandPiece = { type, color: 'white' };
        this.selectedBoardHex = null;
        this.renderer.selectedHex = null;
        this.renderer.validMoves = [];
        this.renderer.draw();
        this.updateUI();
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
                    window.game.ai.makeMove(() => {
                        this.aiThinking = false;
                        this.updateUI();
                        this.renderer.draw();
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
