class HiveAI {
    constructor(engine) {
        this.engine = engine;
    }

    makeMove(callback) {
        const move = this.getBestMove();
        if (move) {
            if (move.type === 'place') {
                this.engine.placePiece(move.q, move.r, move.pieceType, 'black');
            } else {
                this.engine.movePiece(move.fromQ, move.fromR, move.toQ, move.toR);
            }
        } else {
            console.log("AI Pass");
            this.engine.endTurn();
        }
        if (callback) callback();
    }

    getBestMove() {
        const moves = this.getAllLegalMoves('black');
        if (moves.length === 0) return null;
        return moves[Math.floor(Math.random() * moves.length)];
    }

    getAllLegalMoves(color) {
        const moves = [];
        const myHand = this.engine.hands[color];

        // 1. Placements
        const candidates = new Set();
        if (this.engine.board.size === 0) {
            candidates.add("0,0");
        } else {
            // Find neighbors of existing pieces
            if (this.engine.board.size === 1) {
                const [k] = this.engine.board.keys();
                const [q, r] = k.split(',').map(Number);
                this.engine.getNeighbors(q, r).forEach(n => candidates.add(`${n.q},${n.r}`));
            } else {
                for (const [k, p] of this.engine.board) {
                    if (p.color === color) {
                        const [q, r] = k.split(',').map(Number);
                        this.engine.getNeighbors(q, r).forEach(n => candidates.add(`${n.q},${n.r}`));
                    }
                }
            }
        }

        candidates.forEach(k => {
            const [q, r] = k.split(',').map(Number);
            Object.keys(myHand).forEach(type => {
                if (this.engine.canPlacePiece(q, r, type, color)) {
                    moves.push({ type: 'place', q, r, pieceType: type });
                }
            });
        });

        // 2. Movements
        if (myHand[PieceType.QUEEN] === 0) {
            for (const [k, p] of this.engine.board) {
                if (p.color === color) {
                    const [q, r] = k.split(',').map(Number);

                    // Brute force scan perimeter + occupied (for climbers)
                    const potentialTargets = new Set();
                    for (const [bk, _] of this.engine.board) {
                        const [bq, br] = bk.split(',').map(Number);
                        potentialTargets.add(`${bq},${br}`); // Climbing targets
                        this.engine.getNeighbors(bq, br).forEach(n => {
                            potentialTargets.add(`${n.q},${n.r}`); // Empty neighbors
                        });
                    }

                    potentialTargets.forEach(pk => {
                        const [tq, tr] = pk.split(',').map(Number);
                        if (tq === q && tr === r) return;

                        if (this.engine.isValidMove(q, r, tq, tr)) {
                            moves.push({ type: 'move', fromQ: q, fromR: r, toQ: tq, toR: tr });
                        }
                    });
                }
            }
        }

        return moves;
    }
}
