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
        this.highlightHex = null;
        this.animatingPieces = new Map(); // key -> {x, y, targetX, targetY, startTime, duration, piece}
        this.lastFrameTime = 0;
        this.isAnimating = false;

        // Color Palette
        this.colors = {
            background: '#e8f4f8',
            whitePiece: '#f5f5f5',
            blackPiece: '#3a3a3a',
            whitePieceText: '#333',
            blackPieceText: '#fff',
            selected: 'rgba(255, 200, 50, 0.6)',
            validMove: 'rgba(100, 200, 100, 0.5)',
            highlight: 'rgba(100, 150, 255, 0.4)'
        };

        // Piece Symbols
        this.pieceSymbols = {
            [PieceType.QUEEN]: '👑',
            [PieceType.ANT]: '🐜',
            [PieceType.SPIDER]: '🕷️',
            [PieceType.BEETLE]: '🪲',
            [PieceType.GRASSHOPPER]: '🦗',
            [PieceType.MOSQUITO]: '🦟',
            [PieceType.LADYBUG]: '🐞',
            [PieceType.PILLBUG]: '🐛'
        };
    }

    get hexSize() {
        return this.baseHexSize * this.zoom;
    }

    setZoom(newZoom) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
        this.draw();
    }

    resize() {
        const container = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;

        // Get available size from container
        const rect = container.getBoundingClientRect();

        this.logicalWidth = Math.max(400, rect.width);
        this.logicalHeight = Math.max(400, rect.height);

        this.canvas.width = this.logicalWidth * dpr;
        this.canvas.height = this.logicalHeight * dpr;
        this.canvas.style.width = `${this.logicalWidth}px`;
        this.canvas.style.height = `${this.logicalHeight}px`;

        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.centerCamera();
        this.draw();
    }

    centerCamera() {
        // Center on the hive or the canvas center if empty
        if (this.engine.board.size === 0) {
            this.camera.x = this.logicalWidth / 2;
            this.camera.y = this.logicalHeight / 2;
        } else {
            let sumX = 0, sumY = 0;
            this.engine.board.forEach((_, key) => {
                const [q, r] = key.split(',').map(Number);
                const pos = this.hexToPixelRaw(q, r);
                sumX += pos.x;
                sumY += pos.y;
            });
            const avgX = sumX / this.engine.board.size;
            const avgY = sumY / this.engine.board.size;

            this.camera.x = this.logicalWidth / 2 - avgX;
            this.camera.y = this.logicalHeight / 2 - avgY;
        }
    }

    // Raw hex to pixel without camera offset (for centering calculation)
    hexToPixelRaw(q, r) {
        const size = this.hexSize;
        const x = size * (3 / 2 * q);
        const y = size * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
        return { x, y };
    }

    hexToPixel(q, r) {
        const raw = this.hexToPixelRaw(q, r);
        return {
            x: raw.x + this.camera.x,
            y: raw.y + this.camera.y
        };
    }

    pixelToHex(x, y) {
        const size = this.hexSize;
        const px = x - this.camera.x;
        const py = y - this.camera.y;

        const q = (2 / 3 * px) / size;
        const r = (-1 / 3 * px + Math.sqrt(3) / 3 * py) / size;

        return this.hexRound(q, r);
    }

    hexRound(q, r) {
        const s = -q - r;

        let rq = Math.round(q);
        let rr = Math.round(r);
        let rs = Math.round(s);

        const qDiff = Math.abs(rq - q);
        const rDiff = Math.abs(rr - r);
        const sDiff = Math.abs(rs - s);

        if (qDiff > rDiff && qDiff > sDiff) {
            rq = -rr - rs;
        } else if (rDiff > sDiff) {
            rr = -rq - rs;
        }

        return { q: rq, r: rr };
    }

    // Animation for dropping a new piece
    animateDrop(key, q, r, duration = 250) {
        const end = this.hexToPixel(q, r);
        const piece = this.engine.board.get(key);

        if (!piece) return;

        this.animatingPieces.set(key, {
            sx: end.x, sy: end.y - 100, // Start above
            ex: end.x, ey: end.y,
            startTime: performance.now(),
            duration: duration,
            piece: piece
        });

        this.startAnimationLoop();
    }

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
