import Updater from '../js/updater.js'

const updater = new Updater
//-----------------------------------------------//
//----------------rzucanie kostki----------------//
//-----------------------------------------------//
let rollButt = document.querySelector('#roll')
let dice = document.querySelector('#dice')
rollButt.onclick = () => {
    fetch('/rollTheDice')
        .then(res => res.json())
        .then(data => {
            showDiceSequence(data.rolls)
            displayMoves(data.pawnMoves, data.color)
        })
        .catch(err => {
            console.error(err)
        })
}

const showDiceSequence = async (sequence) => {
    for (const roll of sequence) {
        await delay(180)
        if (roll < 7 || roll > 0)
            dice.style.backgroundImage = `url(../gfx/${roll}.png)`
        else
            dice.style.backgroundImage = `url(../gfx/error.png)`

    }
}

const delay = ms => new Promise(res => setTimeout(res, ms));
//-----------------------------------------------//
//--zrobienie coby sie migalo co sie ma ruszyc---//
//-----------------------------------------------//
const board = document.querySelector('#board')
const shadow = document.querySelector('.grey')

const displayMoves = (moves, color) => {
    // console.log(moves)
    let divs = document.querySelectorAll(`.${color}`)
    for (let i = 0; i < 4; i++) {
        if (moves[i].next == undefined) continue
        let div = divs[i]
        console.log(div)
        div.classList.add('blink')
        div.onclick = () => {
            fetch('/move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    i: i
                }),
            })
        }
        div.onmouseenter = () => {
            shadow.style.left = `${moves[i].next.x + board.offsetLeft}px`
            shadow.style.top = `${moves[i].next.y + board.offsetTop}px`
        }
        div.onmouseleave = () => {
            shadow.style.left = `-50px`
            shadow.style.top = `0px`
        }

    }
}

//-----------------------------------------------//
//--------------cykliczne pytanko----------------//
//-----------------------------------------------//
let interval = setInterval(() => {
    fetch('/getUpdates')
        .then(res => res.json())
        .then(data => {
            update(data)
        })
        .catch(err => {
            console.error(err)
        })
}, 250)

const update = (gameData) => {
    updater.updatePlayers(gameData.players)
    updater.updateRoom(gameData.room)
    updater.updatePawns(gameData.pawns)
    if (gameData.room.finished) {
        clearInterval(interval)
        updater.showVictoryScreen(gameData.room.winner)
    }
}
//-----------------------------------------------//
//------------------redowanie sie----------------//
//-----------------------------------------------//
let ready = document.querySelector('#ready')
ready.onclick = () => {
    fetch('/changeReady', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            state: ready.checked
        }),
    })
}





//-----------------------------------------------//
//------------wychodzenie z pokoju---------------//
//-----------------------------------------------//
let leave = document.querySelector('#leave')
leave.onclick = () => {
    document.cookie = "id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    location.reload()
}