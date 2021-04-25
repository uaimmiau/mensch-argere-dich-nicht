//------------------------------------//
//------------------------------------//
//--------Importy i inny syf----------//
//------------------------------------//
//------------------------------------//
const Player = require('./static/classes/Player')
const Room = require('./static/classes/Room')
const Finder = require('./static/classes/Finder')
const Dice = require('./static/classes/Dice')
const Logic = require('./static/classes/Logic')


let express = require("express");
let app = express();
let path = require("path");
const {
    v1: uuidv1,
    v4: uuidv4,
} = require('uuid');
require("colors");
let PORT = process.env.PORT || 3000;
let cookieParser = require('cookie-parser')
app.use(cookieParser())

let bodyParser = require("body-parser")
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(express.static("static"));
//------------------------------------//
//------------------------------------//
//--------Gety i inne takie-----------//
//------------------------------------//
//------------------------------------//
let rooms = []
const finder = new Finder(),
    dice = new Dice(),
    logic = new Logic()


app.get('/', (req, res) => {
    const id = req.cookies.id
    if (id != undefined) {
        res.sendFile(path.join(__dirname + '/static/html/game.html'))
    } else {
        res.redirect('/login')
    }
})

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname + '/static/html/login.html'))
})

app.post('/login', (req, res) => {
    if (req.cookies.id != undefined) {
        res.redirect('/')
        return
    }
    let room = finder.findNotEmptyRoom(rooms)
    if (room == false) {
        room = new Room()
        rooms.push(room)
    }
    let player = new Player(req.body.nick, uuidv4(), room.giveColor())
    room.addPlayerToRoom(player)
    res.cookie('id', player.id, {
        maxAge: 1000 * 60 * 60 * 4
    })
    logic.addPawns(player)
    res.redirect('/')
})

app.get('/rollTheDice', (req, res) => {
    const id = req.cookies.id

    //----sprawdzam czy pokój gracza jest aktywny
    if (!finder.findRoomById(rooms, id).active) return res.end()
    //----sprawdzam czy gracz jest aktywnym
    if (id != finder.findActivePlayer(rooms, id).id) return res.end()

    let player = finder.findPlayerById(rooms, id)
    //----sprawdzenie czy już było turlane
    if (player.roll.expires > Date.now()) return res.end()

    const rolls = dice.generateDiceSequence()
    player.roll = {
        value: rolls[dice.rolls - 1],
        time: Date.now(),
        expires: 0
    }
    let room = finder.findRoomById(rooms, id),
        timeLeft = Math.floor(((1000 * room.turnTime) - (Date.now() - room.turnStart)) / 1000),
        pawnMoves = logic.retrievePawnsThatCanMove(player, rolls[dice.rolls - 1])

    if (logic.checkIfMovesAreEmpty(pawnMoves)) {
        player.roll.expires = player.roll.time + (dice.rolls * 180)
        setTimeout(() => {
            room.clearGameInterval()
        }, dice.rolls * 180)
    } else {
        player.roll.expires = player.roll.time + timeLeft * 1000 + 1000
    }
    res.send(JSON.stringify({
        rolls: rolls,
        pawnMoves: pawnMoves,
        color: player.color
    }))
})

app.get('/getUpdates', (req, res) => {
    const id = req.cookies.id
    let currentPlayers = finder.findPlayersInRoomByPlayerId(rooms, id),
        room = finder.findRoomById(rooms, id),
        state = false,
        activePlayer = {},
        timeLeft = 10,
        pawns = {},
        finished = false,
        winner = undefined
    if (room != undefined) {
        state = room.active
        finished = room.finished
        winner = room.winner
        timeLeft = Math.floor(((1000 * room.turnTime) - (Date.now() - room.turnStart)) / 1000)
        let player = finder.findActivePlayer(rooms, id)
        if (player != undefined) {
            activePlayer = {
                nick: player.nick,
                id: player.id,
                roll: player.roll
            }
        }
        pawns = room.retrieveAllPawns()
    }

    res.send(JSON.stringify({
        players: currentPlayers,
        room: {
            state: state,
            activePlayer: activePlayer,
            timeLeft: timeLeft,
            finished: finished,
            winner: winner
        },
        pawns: {
            currentPositions: pawns
        }
    }))
    res.end()
})

app.post('/changeReady', (req, res) => {
    let player = finder.findPlayerById(rooms, req.cookies.id)
    player.ready = req.body.state
    if (finder.findIfGameCanStart(rooms, req.cookies.id)) {
        let room = finder.findRoomById(rooms, req.cookies.id)
        room.startGame()
    }
    res.end()
})

app.post('/move', (req, res) => {
    const id = req.cookies.id
    if (id != finder.findActivePlayer(rooms, id).id) return res.end()
    const i = req.body.i
    let player = finder.findPlayerById(rooms, id)
    const room = finder.findRoomById(rooms, id)
    const moves = logic.retrievePawnsThatCanMove(player, player.roll.value)
    let pawn = player.pawns[i]
    pawn.moveSelf(moves[i])
    player.roll.expires = Date.now()
    room.clearGameInterval()
    logic.killAllPawnsOnTile(pawn, room, player.color)
    logic.checkIfPlayerWon(player, room)
    res.end()
})



app.listen(PORT, function () {
    console.log("reactor: online".red, "\nsensors: online".red, "\nweapons: online".red, "\nAll systems: nominal".blue);
});