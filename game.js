const express = require('express'),
  socket = require('socket.io'),
  body = require('body-parser'),
  helmet = require("helmet")
const port =  process.env.PORT || 2233
const cors = require('cors')


const app = express();
// goble varble
let arr_check = []
const rooms = {}, games = {}
const roomSize = { 2: '1', 3: '2', 4: '3' };
const arr_timer = ['30', '60', '90' , '120']
const arr_ball = ['16', '24','32', '40']
let a = getRandomInt(0, 3)

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const server = app.listen(port, function() {
  console.log(`lister is prt on  ${port}`);
});

//static file

const io = socket(server)

app.use(helmet())
app.use(body.json())
app.use(cors())
app.set('views', './views')
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))

app.get('/', (req, res) => {
  res.render('index')
});

app.get('/:id', (req, res) => {
  if (rooms[req.params.id] == null) return res.redirect('/')
  res.render('player', { roomName: req.params.id })
});


app.post('/create', (req, res) => {
  let playload = guid()
  rooms[playload] = { users: {} }
  games[playload] = {
    "id": playload,
    "balls": parseInt(arr_ball[a]),
    "clients": [],
    "option": req.body.option,
    "timer": parseInt(arr_timer[a]),
    "keys": guid(),
    "getnumber": getRandomInt(1, 99)
  }
  io.emit("new-room", playload)
  res.render('index')
})




// socket coonection
io.on('connection', (socket) => {
  socket.on('connect', () => { console.log(` socket is connected ${socket.id}`)})
  
  socket.on("user-name", data => {
    socket.join(data.room)
    rooms[data.room].users[socket.id] = data.name
    const clientName = data.name
    const gameId = data.room
    const game = games[gameId]
    let roomMax = parseInt(roomSize[game.option])
    if (game.clients.length >= parseInt(game.option)) return
    
    if (game.clients.length === roomMax) updateGameState();
    const color =  {"0": "#4285f4", "1": "#ea4335", "2": "#fbbc05", "3": "#34a853"}[game.clients.length]
    game.clients.push({
      "clientId": clientName,
      "color": color
    })
    io.sockets.to(data.room).emit('list_of_user', game);
  })
  
  socket.on("update", data => {
    const clientId = data.clientId;
    const gameId = data.gameId;
    const ballId = data.ballId;
    const color = data.color;
    let state = games[gameId].state;
    if (!state) state = {} 
    state[ballId] = {
      color: color,
      name: clientId
    }
    games[gameId].state = state;
  })

  socket.on("clear", data => {
    arr_check.push(data.name)
    if (arr_check.length == parseInt(games[data.room].option)) {
      games[data.room] = {}
      arr_check = []
    }
  })
  
  socket.on('disconnect', () => {
    getUserRoom(socket).forEach(room => { 
      delete rooms[room].users[socket.id]
    })
  })
})

function getUserRoom(socket) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[socket.id] != null) names.push(name)
    return names
  }, [])
}

function updateGameState() {
    for (const g of Object.keys(games)) {
      const game = games[g]
      io.sockets.to(game.id).emit('update', game);
    }
    setTimeout(updateGameState, 300);
}

// give the id of game and room are same
function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();