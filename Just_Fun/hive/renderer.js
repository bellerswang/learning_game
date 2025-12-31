class HiveRenderer {
    constructor(canvas, engine) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.engine = engine;
        this.baseHexSize = 45; // Base size
        this.zoom = 1.0;
        this.minZoom = 0.5;
        this.maxZoom = 2.0;

        this.camera = { x: 0, y: 0 };
        this.logicalWidth = 0;
        this.logicalHeight = 0;

        // Interaction state
        this.selectedHex = null;
        this.validMoves = [];
        this.animatingPieces = new Map(); // key -> {x, y, targetX, targetY, startTime, duration, piece}
        this.lastFrameTime = 0;
    }

    // ... hexSize, setZoom, resize, centerCamera, pixelToHex, hexRound, hexToPixel ...

    // Helper to start animation
    animateMove(key, fromQ, fromR, toQ, toR, duration = 300) {
        const start = this.hexToPixel(fromQ, fromR);
        const end = this.hexToPixel(toQ, toR);
        const piece = this.engine.board.get(key); // The piece is already at 'to' logical position in engine

        if (!piece) return;

        this.animatingPieces.set(key, {
            sx: start.x, sy: start.y,
            ex: end.x, ey: end.y,
            startTime: performance.now(),
            duration: duration,
            piece: piece
        });

        this.startAnimationLoop();
    }

    startAnimationLoop() {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const loop = (time) => {
            if (this.animatingPieces.size === 0) {
                this.isAnimating = false;
                this.draw(); // Final draw
                return;
            }

            this.draw(time);
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    draw(time = performance.now()) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw all pieces
        this.engine.board.forEach((piece, key) => {
            // If this piece is animating, calculate its interpolated position
            if (this.animatingPieces.has(key)) {
                const anim = this.animatingPieces.get(key);
                const elapsed = time - anim.startTime;
                const t = Math.min(1, elapsed / anim.duration);
                // Ease out cubic
                const ease = 1 - Math.pow(1 - t, 3);

                const curX = anim.sx + (anim.ex - anim.sx) * ease;
                const curY = anim.sy + (anim.ey - anim.sy) * ease;

                this.drawHexPieceAt(curX, curY, piece);

                if (t >= 1) {
                    this.animatingPieces.delete(key);
                }
            } else {
                // Static piece
                const [q, r] = key.split(',').map(Number);
                const pos = this.hexToPixel(q, r);
                this.drawHexPieceAt(pos.x, pos.y, piece);
            }
        });

        // Draw highlights
        if (this.selectedHex) {
            this.drawHexHighlight(this.selectedHex.q, this.selectedHex.r, this.colors.selected);
        }

        if (this.highlightHex) {
            this.drawHexHighlight(this.highlightHex.q, this.highlightHex.r, this.colors.highlight);
        }

        // Visualize valid moves
        if (this.validMoves && this.validMoves.length > 0) {
            this.validMoves.forEach(m => this.drawHexHighlight(m.q, m.r, this.colors.validMove));
        }
    }

    // Refactored to draw at arbitrary x,y
    drawHexPieceAt(x, y, piece) {
        const color = piece.color === 'white' ? this.colors.whitePiece : this.colors.blackPiece;
        const size = this.hexSize;

        // Draw Shadow
        this.ctx.save();
        this.ctx.shadowColor = "rgba(0,0,0,0.3)";
        this.ctx.shadowBlur = 10 * this.zoom;
        this.ctx.shadowOffsetY = 5 * this.zoom;
        this.drawHexShape(x, y, size - (3 * this.zoom), color);
        this.ctx.restore();

        // Draw Symbol
        this.ctx.fillStyle = piece.color === 'white' ? this.colors.whitePieceText : this.colors.blackPieceText;
        this.ctx.font = `${size * 0.7}px 'Segoe UI Emoji', Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        let label = this.pieceSymbols[piece.type] || piece.type;
        this.ctx.fillText(label, x, y + (size * 0.1));
    }

    // Legacy support for direct calls (though we moved to drawHexPieceAt)
    drawHexPiece(q, r, piece) {
        const pos = this.hexToPixel(q, r);
        this.drawHexPieceAt(pos.x, pos.y, piece);
    }

    drawHexHighlight(q, r, color) {
        const center = this.hexToPixel(q, r);
        this.ctx.save();
        this.drawHexShape(center.x, center.y, this.hexSize - (1 * this.zoom), color);
        this.ctx.restore();
    }

    drawHexShape(x, y, size, color) {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle_deg = 60 * i;
            const angle_rad = Math.PI / 180 * angle_deg;
            const px = x + size * Math.cos(angle_rad);
            const py = y + size * Math.sin(angle_rad);
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }
}
