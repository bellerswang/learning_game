// Difficulty levels
const AI_DIFFICULTY = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard'
};

class HiveAI {
    constructor(engine, difficulty = AI_DIFFICULTY.MEDIUM) {
        this.engine = engine;
        this.difficulty = difficulty;

        // Evaluation weights
        this.weights = {
            queenSafety: 50,      // Empty spaces around own queen
            queenAttack: 40,      // Pieces around enemy queen
            mobility: 10,         // Number of available moves
            centerControl: 5,     // Pieces closer to center
            earlyQueenPenalty: 30 // Penalty for queen out before turn 4
        };
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }

    // Returns move details via callback to support animation
    makeMove(callback) {
        const move = this.getBestMove();

        if (move) {
            if (move.type === 'place') {
                this.engine.placePiece(move.q, move.r, move.pieceType, 'black');
                if (callback) callback({ type: 'place', q: move.q, r: move.r });
            } else {
                this.engine.movePiece(move.fromQ, move.fromR, move.toQ, move.toR);
                if (callback) callback({
                    type: 'move',
                    fromQ: move.fromQ, fromR: move.fromR,
                    toQ: move.toQ, toR: move.toR
                });
            }
        } else {
            console.log("AI Pass");
            this.engine.endTurn();
            if (callback) callback(null);
        }
    }

    getBestMove() {
        const moves = this.getAllLegalMoves('black');
        if (moves.length === 0) return null;

        switch (this.difficulty) {
            case AI_DIFFICULTY.EASY:
                return this.getRandomMove(moves);
            case AI_DIFFICULTY.MEDIUM:
                return this.getBestMoveOnePly(moves);
            case AI_DIFFICULTY.HARD:
                return this.getBestMoveMinimax(moves, 2);
            default:
                return this.getBestMoveOnePly(moves);
        }
    }

    // Easy: Random move
    getRandomMove(moves) {
        return moves[Math.floor(Math.random() * moves.length)];
    }

    // Medium: 1-ply lookahead - pick best immediate result
    getBestMoveOnePly(moves) {
        let bestMove = null;
        let bestScore = -Infinity;

        for (const move of moves) {
            const score = this.evaluateMove(move);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove || moves[0];
    }

    // Hard: Minimax with alpha-beta pruning
    getBestMoveMinimax(moves, depth) {
        let bestMove = null;
        let bestScore = -Infinity;

        for (const move of moves) {
            // Simulate move
            const undoInfo = this.simulateMove(move);

            // Minimax evaluation (opponent's turn next)
            const score = this.minimax(depth - 1, -Infinity, Infinity, false);

            // Undo move
            this.undoMove(move, undoInfo);

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove || moves[0];
    }

    minimax(depth, alpha, beta, isMaximizing) {
        // Check for game over or depth limit
        if (depth === 0 || this.engine.winner) {
            return this.evaluateBoard();
        }

        const color = isMaximizing ? 'black' : 'white';
        const moves = this.getAllLegalMoves(color);

        if (moves.length === 0) {
            return this.evaluateBoard();
        }

        if (isMaximizing) {
            let maxScore = -Infinity;
            for (const move of moves.slice(0, 10)) { // Limit for performance
                const undoInfo = this.simulateMove(move);
                const score = this.minimax(depth - 1, alpha, beta, false);
                this.undoMove(move, undoInfo);

                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (const move of moves.slice(0, 10)) { // Limit for performance
                const undoInfo = this.simulateMove(move);
                const score = this.minimax(depth - 1, alpha, beta, true);
                this.undoMove(move, undoInfo);

                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
            return minScore;
        }
    }

    // Simulate a move and return undo info
    simulateMove(move) {
        const undoInfo = {};

        if (move.type === 'place') {
            this.engine.board.set(`${move.q},${move.r}`, new Piece(move.pieceType, 'black'));
            this.engine.hands['black'][move.pieceType]--;
            undoInfo.type = 'place';
            undoInfo.q = move.q;
            undoInfo.r = move.r;
            undoInfo.pieceType = move.pieceType;
        } else {
            const piece = this.engine.board.get(`${move.fromQ},${move.fromR}`);
            this.engine.board.delete(`${move.fromQ},${move.fromR}`);
            this.engine.board.set(`${move.toQ},${move.toR}`, piece);
            undoInfo.type = 'move';
            undoInfo.fromQ = move.fromQ;
            undoInfo.fromR = move.fromR;
            undoInfo.toQ = move.toQ;
            undoInfo.toR = move.toR;
            undoInfo.piece = piece;
        }

        return undoInfo;
    }

    // Undo a simulated move
    undoMove(move, undoInfo) {
        if (undoInfo.type === 'place') {
            this.engine.board.delete(`${undoInfo.q},${undoInfo.r}`);
            this.engine.hands['black'][undoInfo.pieceType]++;
        } else {
            this.engine.board.delete(`${undoInfo.toQ},${undoInfo.toR}`);
            this.engine.board.set(`${undoInfo.fromQ},${undoInfo.fromR}`, undoInfo.piece);
        }
    }

    // Evaluate a single move (for 1-ply)
    evaluateMove(move) {
        const undoInfo = this.simulateMove(move);
        const score = this.evaluateBoard();
        this.undoMove(move, undoInfo);
        return score;
    }

    // Evaluate current board position for black (AI)
    evaluateBoard() {
        let score = 0;

        // Check for win/loss
        if (this.engine.winner === 'black') return 10000;
        if (this.engine.winner === 'white') return -10000;

        // Find queens
        let blackQueenPos = null;
        let whiteQueenPos = null;

        for (const [key, piece] of this.engine.board) {
            if (piece.type === PieceType.QUEEN) {
                const [q, r] = key.split(',').map(Number);
                if (piece.color === 'black') {
                    blackQueenPos = { q, r };
                } else {
                    whiteQueenPos = { q, r };
                }
            }
        }

        // Queen safety (empty spaces around own queen = good)
        if (blackQueenPos) {
            const neighbors = this.engine.getNeighbors(blackQueenPos.q, blackQueenPos.r);
            const emptyCount = neighbors.filter(n =>
                !this.engine.board.has(`${n.q},${n.r}`)
            ).length;
            score += emptyCount * this.weights.queenSafety;
        }

        // Queen attack (pieces around enemy queen = good)
        if (whiteQueenPos) {
            const neighbors = this.engine.getNeighbors(whiteQueenPos.q, whiteQueenPos.r);
            const occupiedCount = neighbors.filter(n =>
                this.engine.board.has(`${n.q},${n.r}`)
            ).length;
            score += occupiedCount * this.weights.queenAttack;

            // Bonus for nearly winning (5 neighbors)
            if (occupiedCount >= 5) score += 500;
        }

        // Mobility (more moves = better position)
        const blackMoves = this.getAllLegalMoves('black').length;
        const whiteMoves = this.getAllLegalMoves('white').length;
        score += (blackMoves - whiteMoves) * this.weights.mobility;

        // Piece count on board
        let blackPieces = 0;
        let whitePieces = 0;
        for (const [_, piece] of this.engine.board) {
            if (piece.color === 'black') blackPieces++;
            else whitePieces++;
        }
        score += (blackPieces - whitePieces) * 5;

        // Early queen penalty (don't place queen before turn 4 unless forced)
        if (this.engine.turn < 4 && blackQueenPos) {
            score -= this.weights.earlyQueenPenalty;
        }

        return score;
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

        // Prioritize moves for better pruning
        return this.prioritizeMoves(moves, color);
    }

    // Sort moves to improve alpha-beta pruning efficiency
    prioritizeMoves(moves, color) {
        return moves.sort((a, b) => {
            // Prioritize queen attacks
            if (a.type === 'move' || b.type === 'move') {
                // Check if move is adjacent to enemy queen
                const enemyQueenKey = this.findQueenKey(color === 'black' ? 'white' : 'black');
                if (enemyQueenKey) {
                    const [eq, er] = enemyQueenKey.split(',').map(Number);
                    const aAdj = a.type === 'move' &&
                        Math.abs(a.toQ - eq) <= 1 && Math.abs(a.toR - er) <= 1;
                    const bAdj = b.type === 'move' &&
                        Math.abs(b.toQ - eq) <= 1 && Math.abs(b.toR - er) <= 1;
                    if (aAdj && !bAdj) return -1;
                    if (bAdj && !aAdj) return 1;
                }
            }
            return 0;
        });
    }

    findQueenKey(color) {
        for (const [key, piece] of this.engine.board) {
            if (piece.type === PieceType.QUEEN && piece.color === color) {
                return key;
            }
        }
        return null;
    }
}
