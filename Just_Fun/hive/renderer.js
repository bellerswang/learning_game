class HiveRenderer {
    constructor(canvas, engine) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.engine = engine;
        this.hexSize = 45; // Larger pieces
        this.camera = { x: 0, y: 0 };
        this.logicalWidth = 0;
        this.logicalHeight = 0;

        // Interaction state
        this.selectedHex = null;
        this.validMoves = [];
        this.highlightHex = null;

        // Modern Colors
        this.colors = {
            hexFill: '#ffffff',
            hexStroke: '#e0e0e0',
            whitePiece: '#fdfdfd',
            blackPiece: '#34495e',
            whitePieceText: '#2c3e50',
            blackPieceText: '#ecf0f1',
            highlight: 'rgba(241, 196, 15, 0.5)',
            selected: 'rgba(46, 204, 113, 0.5)',
            validMove: 'rgba(52, 152, 219, 0.4)'
        };

        this.pieceSymbols = {
            [PieceType.QUEEN]: '♕',
            [PieceType.ANT]: '🐜',
            [PieceType.SPIDER]: '🕷️',
            [PieceType.BEETLE]: '🪲',
            [PieceType.GRASSHOPPER]: '🦗',
            [PieceType.MOSQUITO]: '🦟',
            [PieceType.LADYBUG]: '🐞',
            [PieceType.PILLBUG]: '💊'
        };
    }

    resize() {
        const parent = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;

        // Logical size
        this.logicalWidth = parent.clientWidth;
        this.logicalHeight = parent.clientHeight;

        // Physical size
        this.canvas.width = this.logicalWidth * dpr;
        this.canvas.height = this.logicalHeight * dpr;

        // CSS size
        this.canvas.style.width = `${this.logicalWidth}px`;
        this.canvas.style.height = `${this.logicalHeight}px`;

        // Scale context
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform compatible
        this.ctx.scale(dpr, dpr);

        this.centerCamera();
        this.draw();
    }

    centerCamera() {
        this.camera.x = this.logicalWidth / 2;
        this.camera.y = this.logicalHeight / 2;
    }

    // Convert screen (pixel) to Axial (q, r)
    pixelToHex(x, y) {
        const relX = x - this.camera.x;
        const relY = y - this.camera.y;

        const q = (2 / 3 * relX) / this.hexSize;
        const r = (-1 / 3 * relX + Math.sqrt(3) / 3 * relY) / this.hexSize;

        return this.hexRound(q, r);
    }

    hexRound(q, r) {
        let s = -q - r;
        let rq = Math.round(q);
        let rr = Math.round(r);
        let rs = Math.round(s);

        const q_diff = Math.abs(rq - q);
        const r_diff = Math.abs(rr - r);
        const s_diff = Math.abs(rs - s);

        if (q_diff > r_diff && q_diff > s_diff) {
            rq = -rr - rs;
        } else if (r_diff > s_diff) {
            rr = -rq - rs;
        }

        return { q: rq, r: rr };
    }

    // Convert Axial (q, r) to screen (x, y)
    hexToPixel(q, r) {
        const x = this.hexSize * (3 / 2 * q);
        const y = this.hexSize * (Math.sqrt(3) * (r + q / 2));
        return {
            x: x + this.camera.x,
            y: y + this.camera.y
        };
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background grid (optional)

        // Draw all pieces on board
        this.engine.board.forEach((piece, key) => {
            const [q, r] = key.split(',').map(Number);
            this.drawHexPiece(q, r, piece);
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

    drawHexPiece(q, r, piece) {
        const center = this.hexToPixel(q, r);
        const color = piece.color === 'white' ? this.colors.whitePiece : this.colors.blackPiece;

        // Draw Shadow
        this.ctx.save();
        this.ctx.shadowColor = "rgba(0,0,0,0.3)";
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetY = 5;
        this.drawHexShape(center.x, center.y, this.hexSize - 3, color);
        this.ctx.restore();

        // Draw Symbol
        this.ctx.fillStyle = piece.color === 'white' ? this.colors.whitePieceText : this.colors.blackPieceText;
        this.ctx.font = `${this.hexSize * 0.7}px 'Segoe UI Emoji', Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        let label = this.pieceSymbols[piece.type] || piece.type;
        this.ctx.fillText(label, center.x, center.y + (this.hexSize * 0.1));
    }

    drawHexHighlight(q, r, color) {
        const center = this.hexToPixel(q, r);
        this.ctx.save();
        this.drawHexShape(center.x, center.y, this.hexSize - 1, color);
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
