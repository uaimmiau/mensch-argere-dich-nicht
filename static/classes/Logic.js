const Matrix = require('./Matrix')
const Pawn = require('./Pawn')

class Logic {
    constructor() {
        this.matrix = new Matrix()
    }

    addPawns(player) {
        const color = player.color
        for (let i = 0; i < 4; i++) {
            player.pawns.push(new Pawn(
                this.matrix[color].startPositions[i].x,
                this.matrix[color].startPositions[i].y,
                this.matrix[color].startPositionIndex
            ))
        }
    }

    retrievePawnsThatCanMove(player, move) {
        const color = player.color
        let tab = []

        for (const pawn of player.pawns) {
            let endI = this.matrix[color].enterEndPositionIndex,
                newI = pawn.i + move
            //----sprawdzenie czy już wyszedł
            if (!this.checkIfPawnLeftStart(pawn, color)) {
                if (move == 1 || move == 6) {
                    tab.push({
                        next: {
                            x: this.matrix.boardMatrix[pawn.i].x,
                            y: this.matrix.boardMatrix[pawn.i].y,
                            i: this.matrix[color].startPositionIndex
                        },
                        house: false
                    })
                } else {
                    tab.push({
                        next: undefined
                    })
                }

                //----sprawdzamy czy już jest w domku
            } else if (this.checkIfPawnIsInHouse(pawn, color)[0]) {
                let houseI = this.checkIfPawnIsInHouse(pawn, color)[1]
                //----sprawdzamy czy da rady wejsc glebiej
                if (this.checkIfHouseIndexIsEmpty(player.pawns, color, houseI + move)) {
                    tab.push({
                        next: {
                            x: this.matrix[color].endPositions[houseI + move].x,
                            y: this.matrix[color].endPositions[houseI + move].y,
                            i: houseI + move
                        },
                        house: true
                    })
                } else {
                    tab.push({
                        next: undefined
                    })
                }
                // ----sprawdzamy czy przechodzi przez wejscie do domku
            } else if (pawn.i <= endI && newI > endI) {
                //----sprawdzam czy nie wychodzi poza domek
                if (newI > (endI + 4)) {
                    tab.push({
                        next: undefined
                    })
                } else {
                    let houseI = newI - endI - 1
                    //----sprawdzam czy miejsce w domku jest puste
                    if (this.checkIfHouseIndexIsEmpty(player.pawns, color, houseI)) {
                        tab.push({
                            next: {
                                x: this.matrix[color].endPositions[houseI].x,
                                y: this.matrix[color].endPositions[houseI].y,
                                i: houseI
                            },
                            house: true
                        })
                    } else {
                        tab.push({
                            next: undefined
                        })
                    }
                }
                //----pionek wyszedł i nie dotrze do domku
            } else {
                if (newI > 39)
                    newI = newI - 40
                tab.push({
                    next: {
                        x: this.matrix.boardMatrix[newI].x,
                        y: this.matrix.boardMatrix[newI].y,
                        i: newI
                    },
                    house: false
                })
            }
        }
        return tab
    }

    checkIfPawnLeftStart(pawn, color) {
        for (const pos of this.matrix[color].startPositions) {
            if (pos.x == pawn.x && pos.y == pawn.y)
                return false //--- nie wyszedl
        }
        return true //--- wyszedl
    }

    checkIfHouseIndexIsEmpty(pawns, color, i) {
        if (i > 3) return false
        const pos = this.matrix[color].endPositions[i]
        for (const pawn of pawns) {
            // console.log(pawn, pos, 'test', i)
            if (pawn.x == pos.x && pawn.y == pos.y)
                return false
        }
        return true
    }

    checkIfPawnIsInHouse(pawn, color) {
        const pos = this.matrix[color].endPositions
        for (let i = 0; i < 4; i++) {
            if (pos[i].x == pawn.x && pos[i].y == pawn.y)
                return [true, i]
        }
        return [false]
    }

    checkIfMovesAreEmpty(moves) {
        for (const move of moves) {
            if (move.next != undefined)
                return false
        }
        return true
    }

    killAllPawnsOnTile(pawn, room, color) {
        if (this.checkIfPawnIsInHouse(pawn, color)[0]) return

        for (let player of room.players) {
            if (player.color != color) {
                for (let i = 0; i < 4; i++) {
                    if (this.checkIfPawnIsInHouse(player.pawns[i], player.color)[0]) continue
                    if (player.pawns[i].i == pawn.i) {
                        player.pawns[i].x = this.matrix[player.color].startPositions[i].x
                        player.pawns[i].y = this.matrix[player.color].startPositions[i].y
                        player.pawns[i].i = this.matrix[player.color].startPositionIndex
                    }
                }
            }
        }
    }

    checkIfPlayerWon(player, room) {
        let pawnsInHouse = 0
        for (const pawn of player.pawns) {
            if (this.checkIfPawnIsInHouse(pawn, player.color)[0]) pawnsInHouse++
        }
        if (pawnsInHouse == 4)
            room.endGame(player.nick)
        return
    }
}

module.exports = Logic