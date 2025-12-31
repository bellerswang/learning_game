// Hex Coordinate System (Axial)
class Hex {
    constructor(q, r) {
        this.q = q;
        this.r = r;
    }

    static equals(a, b) {
        return a.q === b.q && a.r === b.r;
    }

    static add(a, b) {
        return new Hex(a.q + b.q, a.r + b.r);
    }

    static distance(a, b) {
        return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
    }
}

const PieceType = {
    QUEEN: 'Q',
    ANT: 'A',
    SPIDER: 'S',
    BEETLE: 'B',
    GRASSHOPPER: 'G',
    MOSQUITO: 'M',
    LADYBUG: 'L',
    PILLBUG: 'P'
};

class Piece {
    constructor(type, color) {
        this.type = type;
        this.color = color;
    }
}

class HiveEngine {
    constructor() {
        this.board = new Map();
        this.whiteToMove = true;
        this.turn = 1;
        this.winner = null;

        this.hands = {
            white: {
                [PieceType.QUEEN]: 1,
                [PieceType.ANT]: 3,
                [PieceType.SPIDER]: 2,
                [PieceType.BEETLE]: 2,
                [PieceType.GRASSHOPPER]: 3,
                [PieceType.MOSQUITO]: 1,
                [PieceType.LADYBUG]: 1,
                [PieceType.PILLBUG]: 1
            },
            black: {
                [PieceType.QUEEN]: 1,
                [PieceType.ANT]: 3,
                [PieceType.SPIDER]: 2,
                [PieceType.BEETLE]: 2,
                [PieceType.GRASSHOPPER]: 3,
                [PieceType.MOSQUITO]: 1,
                [PieceType.LADYBUG]: 1,
                [PieceType.PILLBUG]: 1
            }
        };
    }

    getHex(q, r) {
        return this.board.get(`${q},${r}`);
    }

    canPlacePiece(q, r, type, color) {
        const key = `${q},${r}`;
        if (this.board.has(key)) return false;
        if (this.hands[color][type] <= 0) return false;

        if (color === (this.whiteToMove ? 'white' : 'black') &&
            this.turn === 4 &&
            this.hands[color][PieceType.QUEEN] > 0 &&
            type !== PieceType.QUEEN) return false;

        if (this.board.size === 0) return true;
        if (this.board.size === 1) return this.hasNeighbor(q, r);

        return this.hasNeighborOfColor(q, r, color) &&
            !this.hasNeighborOfColor(q, r, color === 'white' ? 'black' : 'white');
    }

    placePiece(q, r, type, color) {
        if (!this.canPlacePiece(q, r, type, color)) return false;

        this.board.set(`${q},${r}`, new Piece(type, color));
        this.hands[color][type]--;
        this.endTurn();
        return true;
    }

    isValidMove(fromQ, fromR, toQ, toR) {
        const fromKey = `${fromQ},${fromR}`;
        const toKey = `${toQ},${toR}`;

        if (!this.board.has(fromKey)) return false;
        const piece = this.board.get(fromKey);

        if (piece.color !== (this.whiteToMove ? 'white' : 'black')) return false;

        // Queen must be placed
        if (this.hands[piece.color][PieceType.QUEEN] > 0) return false;

        // One Hive Check (except if Mosq/Beetle/Ladybug moving ON TOP, hive still connected below? No, "One Hive" applies to stacks)
        // If moving ON TOP, we technically check if removing the piece breaks the hive.
        // But for verification simplicity, we assume removing it checks connectivity.
        if (!this.isHiveConnected(fromKey)) return false;

        // Target occupancy check
        const targetOccupied = this.board.has(toKey);

        // Piece Rules
        let type = piece.type;

        // Mosquito Logic: Acts as neighbors
        if (type === PieceType.MOSQUITO) {
            // Cannot move if on top? (Mosquito as Beetle can)
            // If on ground, adopts touching pieces abilities.
            // If on top (acting as Beetle), continues acting as Beetle. (Simplification: Mosquito is Beetle if z>0, but we don't track Z yet perfectly)
            // Implementation: Scan neighbors. If any neighbor is X, we can move like X.
            // Exception: Cannot copy Mosquito. Copying Beetle allows climbing.
            // If touching multiple, can choose.
            // We return true if ANY ability is valid.

            // If target is occupied, ONLY valid if copying Beetle.
            if (targetOccupied) {
                // Check if touching a Beetle?
                if (!this.isTouchingType(fromQ, fromR, PieceType.BEETLE)) return false;
                return this.validateBeetleMove(fromQ, fromR, toQ, toR);
            }

            // If target empty, try all abilities of neighbors
            const neighbors = this.getNeighbors(fromQ, fromR);
            for (let n of neighbors) {
                const p = this.board.get(`${n.q},${n.r}`);
                if (p) {
                    if (p.type === PieceType.ANT && this.validateSlidePath(fromQ, fromR, toQ, toR, Infinity)) return true;
                    if (p.type === PieceType.SPIDER && this.validateSpiderMove(fromQ, fromR, toQ, toR)) return true;
                    if (p.type === PieceType.GRASSHOPPER && this.validateJump(fromQ, fromR, toQ, toR)) return true;
                    if (p.type === PieceType.QUEEN && this.validateSlide(fromQ, fromR, toQ, toR) && Hex.distance({ q: fromQ, r: fromR }, { q: toQ, r: toR }) === 1) return true;
                    if (p.type === PieceType.BEETLE && this.validateBeetleMove(fromQ, fromR, toQ, toR)) return true;
                    if (p.type === PieceType.LADYBUG && this.validateLadybugMove(fromQ, fromR, toQ, toR)) return true;
                    // Pillbug movement ability (Move self like Queen? No, Pillbug moves 1 space)
                    if (p.type === PieceType.PILLBUG && this.validateSlide(fromQ, fromR, toQ, toR) && Hex.distance({ q: fromQ, r: fromR }, { q: toQ, r: toR }) === 1) return true;
                }
            }
            return false;
        }

        // Standard Checks
        if (targetOccupied && type !== PieceType.BEETLE && type !== PieceType.LADYBUG) return false; // LADYBUG ends on empty, but traverses top.

        switch (type) {
            case PieceType.QUEEN:
                return !targetOccupied && this.validateSlide(fromQ, fromR, toQ, toR) && Hex.distance({ q: fromQ, r: fromR }, { q: toQ, r: toR }) === 1;
            case PieceType.ANT:
                return !targetOccupied && this.validateSlidePath(fromQ, fromR, toQ, toR, Infinity);
            case PieceType.SPIDER:
                return !targetOccupied && this.validateSpiderMove(fromQ, fromR, toQ, toR);
            case PieceType.GRASSHOPPER:
                return !targetOccupied && this.validateJump(fromQ, fromR, toQ, toR);
            case PieceType.BEETLE:
                return this.validateBeetleMove(fromQ, fromR, toQ, toR);
            case PieceType.LADYBUG:
                return !targetOccupied && this.validateLadybugMove(fromQ, fromR, toQ, toR);
            case PieceType.PILLBUG:
                // Move logic: Like Queen (1 step slide)
                // Ability logic (move other) is separate action? 
                // For MVP, Pillbug only moves itself. Ability is complex UI.
                return !targetOccupied && this.validateSlide(fromQ, fromR, toQ, toR) && Hex.distance({ q: fromQ, r: fromR }, { q: toQ, r: toR }) === 1;
        }
        return false;
    }

    movePiece(fromQ, fromR, toQ, toR) {
        if (this.isValidMove(fromQ, fromR, toQ, toR)) {
            const piece = this.board.get(`${fromQ},${fromR}`);
            this.board.delete(`${fromQ},${fromR}`);
            this.board.set(`${toQ},${toR}`, piece);
            this.endTurn();
            return true;
        }
        return false;
    }

    // --- Helpers ---

    isTouchingType(q, r, type) {
        return this.getNeighbors(q, r).some(n => {
            const p = this.board.get(`${n.q},${n.r}`);
            return p && p.type === type;
        });
    }

    validateLadybugMove(q1, r1, q2, r2) {
        // 3 steps: 2 on top, 1 down.
        // Must start on Hive (standard).
        // Step 1: Must climb up (to occupied).
        // Step 2: Move on top (occupied).
        // Step 3: Step down (to empty).

        // BFS/DFS exactly 3 steps matching profile?
        // Step 0 -> Step 1 (Occupied) -> Step 2 (Occupied) -> Step 3 (Empty & Target)

        const neighbors1 = this.getNeighbors(q1, r1);
        for (let n1 of neighbors1) {
            if (this.board.has(`${n1.q},${n1.r}`)) { // Step 1 Occupied
                const neighbors2 = this.getNeighbors(n1.q, n1.r);
                for (let n2 of neighbors2) {
                    if (this.board.has(`${n2.q},${n2.r}`)) { // Step 2 Occupied
                        const neighbors3 = this.getNeighbors(n2.q, n2.r);
                        for (let n3 of neighbors3) {
                            if (!this.board.has(`${n3.q},${n3.r}`) && n3.q === q2 && n3.r === r2) { // Step 3 Empty & Target
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    // ... (include previous helpers: isHiveConnected, canSlide, etc.) ...
    isHiveConnected(excludeKey) {
        const keys = Array.from(this.board.keys()).filter(k => k !== excludeKey);
        if (keys.length <= 1) return true;
        const start = keys[0];
        const visited = new Set([start]);
        const queue = [start];
        while (queue.length) {
            const curr = queue.shift();
            const [q, r] = curr.split(',').map(Number);
            this.getNeighbors(q, r).forEach(n => {
                const k = `${n.q},${n.r}`;
                if (keys.includes(k) && !visited.has(k)) {
                    visited.add(k);
                    queue.push(k);
                }
            });
        }
        return visited.size === keys.length;
    }

    canSlide(q1, r1, q2, r2) {
        const mutuals = this.getMutualNeighbors(q1, r1, q2, r2);
        let occupied = 0;
        mutuals.forEach(m => {
            if (this.board.has(`${m.q},${m.r}`)) occupied++;
        });
        return occupied < 2;
    }

    validateSlide(q1, r1, q2, r2) {
        if (q1 === q2 && r1 === r2) return false;
        if (Hex.distance({ q: q1, r: r1 }, { q: q2, r: r2 }) !== 1) return false;
        if (!this.canSlide(q1, r1, q2, r2)) return false;
        if (!this.hasNeighbor(q2, r2, q1, r1)) return false;
        return true;
    }

    validateSlidePath(currentQ, currentR, targetQ, targetR, limit) {
        if (currentQ === targetQ && currentR === targetR) return false;
        const queue = [{ q: currentQ, r: currentR, dist: 0 }];
        const visited = new Set([`${currentQ},${currentR}`]);
        while (queue.length) {
            const { q, r, dist } = queue.shift();
            if (q === targetQ && r === targetR) return limit === Infinity ? true : dist === limit;
            if (dist >= limit) continue;

            this.getNeighbors(q, r).forEach(n => {
                const k = `${n.q},${n.r}`;
                if (!visited.has(k) && !this.board.has(k)) {
                    if (this.canSlide(q, r, n.q, n.r) && this.hasSimpleNeighbor(n.q, n.r, currentQ, currentR)) {
                        visited.add(k);
                        queue.push({ q: n.q, r: n.r, dist: dist + 1 });
                    }
                }
            });
        }
        return false;
    }

    validateSpiderMove(q1, r1, q2, r2) {
        return this.validateSlidePath(q1, r1, q2, r2, 3);
    }

    validateJump(q1, r1, q2, r2) {
        if (q1 === q2 || r1 === r2 || (q1 + r1) === (q2 + r2)) {
            const dist = Hex.distance({ q: q1, r: r1 }, { q: q2, r: r2 });
            if (dist === 1) return false;

            const dQ = Math.sign(q2 - q1), dR = Math.sign(r2 - r1);
            let cQ = q1 + dQ, cR = r1 + dR;
            while (cQ !== q2 || cR !== r2) {
                if (!this.board.has(`${cQ},${cR}`)) return false;
                cQ += dQ; cR += dR;
            }
            return true;
        }
        return false;
    }

    validateBeetleMove(q1, r1, q2, r2) {
        if (Hex.distance({ q: q1, r: r1 }, { q: q2, r: r2 }) !== 1) return false;
        if (!this.board.has(`${q2},${r2}`)) return this.validateSlide(q1, r1, q2, r2);
        return true;
    }

    getNeighbors(q, r) {
        return [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]].map(d => ({ q: q + d[0], r: r + d[1] }));
    }

    hasNeighbor(q, r, excludeQ, excludeR) {
        return this.hasSimpleNeighbor(q, r, excludeQ, excludeR);
    }

    hasSimpleNeighbor(q, r, excludeQ, excludeR) {
        return this.getNeighbors(q, r).some(n => {
            if (n.q === excludeQ && n.r === excludeR) return false;
            return this.board.has(`${n.q},${n.r}`);
        });
    }

    hasNeighborOfColor(q, r, color) {
        return this.getNeighbors(q, r).some(n => {
            const p = this.board.get(`${n.q},${n.r}`);
            return p && p.color === color;
        });
    }

    getMutualNeighbors(q1, r1, q2, r2) {
        return this.getNeighbors(q1, r1).filter(n => Hex.distance(n, { q: q2, r: r2 }) === 1);
    }

    getValidMoves(initialQ, initialR) {
        if (!this.board.has(`${initialQ},${initialR}`)) return [];

        const piece = this.board.get(`${initialQ},${initialR}`);
        if (piece.color !== (this.whiteToMove ? 'white' : 'black')) return [];
        if (this.hands[piece.color][PieceType.QUEEN] > 0) return [];
        if (!this.isHiveConnected(`${initialQ},${initialR}`)) return [];

        const validMoves = [];
        const candidates = new Set();

        // Scan Perimeter + Occupied (for Beetle/Ladybug/Mosquito)
        // Optimization: scan all existing board keys, get their stored neighbors?
        // Or scanning "All neighbors of all pieces" is safer.
        const allPieceCoords = Array.from(this.board.keys()).map(k => { const [q, r] = k.split(','); return { q: +q, r: +r }; });
        allPieceCoords.forEach(c => {
            // Add the space itself (for climbing onto)
            candidates.add(`${c.q},${c.r}`);
            // Add neighbors
            this.getNeighbors(c.q, c.r).forEach(n => candidates.add(`${n.q},${n.r}`));
        });

        candidates.forEach(key => {
            const [tq, tr] = key.split(',').map(Number);
            if (tq === initialQ && tr === initialR) return;
            if (this.isValidMove(initialQ, initialR, tq, tr)) {
                validMoves.push({ q: tq, r: tr });
            }
        });

        return validMoves;
    }

    endTurn() {
        this.whiteToMove = !this.whiteToMove;
        if (this.whiteToMove) this.turn++;
        ['white', 'black'].forEach(c => {
            const qPiece = Array.from(this.board.values()).find(p => p.type === PieceType.QUEEN && p.color === c);
            if (qPiece) {
                let qQ, qR;
                for (const [k, p] of this.board) { if (p === qPiece) { [qQ, qR] = k.split(',').map(Number); break; } }

                const neighbors = this.getNeighbors(qQ, qR);
                const occupiedCount = neighbors.filter(n => this.board.has(`${n.q},${n.r}`)).length;
                if (occupiedCount === 6) {
                    this.winner = (c === 'white' ? 'black' : 'white');
                }
            }
        });
    }
}
