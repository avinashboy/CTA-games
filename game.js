const express = require('express'),
  socket = require('socket.io'),
  body = require('body-parser'),
  helmet = require("helmet"),
  crypto = require('crypto')
const port =  process.env.PORT || 2233
const cors = require('cors')


const app = express();
// Global variables
let arr_check = []
const rooms = {}, games = {}, activeGames = new Set()
const roomSize = { 2: '1', 3: '2', 4: '3' };
const arr_timer = ['30', '60', '90' , '120']
const arr_ball = ['16', '24','32', '40']
let a = getRandomInt(0, 3)

// Rate limiting per socket
const socketRateLimits = new Map()
const RATE_LIMIT_WINDOW = 1000 // 1 second
const MAX_UPDATES_PER_WINDOW = 10

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Input validation and sanitization
function sanitizeInput(input, maxLength = 50) {
  if (!input || typeof input !== 'string') return ''
  return input.trim().substring(0, maxLength).replace(/[<>]/g, '')
}

function isValidRoomOption(option) {
  return ['2', '3', '4'].includes(String(option))
}

// Rate limiting helper
function checkRateLimit(socketId) {
  const now = Date.now()
  if (!socketRateLimits.has(socketId)) {
    socketRateLimits.set(socketId, [now])
    return true
  }

  const timestamps = socketRateLimits.get(socketId).filter(t => now - t < RATE_LIMIT_WINDOW)
  timestamps.push(now)
  socketRateLimits.set(socketId, timestamps)

  return timestamps.length <= MAX_UPDATES_PER_WINDOW
}

const server = app.listen(port, function() {
  console.log(`lister is prt on  ${port}`);
});

//static file

const io = socket(server)

// Enhanced helmet configuration with CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for inline scripts in EJS
        "https://cdnjs.cloudflare.com",
        "https://code.jquery.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for inline styles
        "https://fonts.googleapis.com",
        "https://maxcdn.bootstrapcdn.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com"
      ],
      connectSrc: ["'self'", "ws:", "wss:"], // Allow WebSocket connections
      imgSrc: ["'self'", "data:", "https:"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))
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
  try {
    // Validate room option
    if (!isValidRoomOption(req.body.option)) {
      return res.status(400).json({ error: 'Invalid room option' })
    }

    let playload = guid()
    rooms[playload] = { users: {}, createdAt: Date.now() }
    games[playload] = {
      "id": playload,
      "balls": parseInt(arr_ball[a]),
      "clients": [],
      "option": String(req.body.option),
      "timer": parseInt(arr_timer[a]),
      "keys": guid(),
      "getnumber": getRandomInt(1, 99),
      "state": {}
    }
    activeGames.add(playload)
    io.emit("new-room", playload)
    res.render('index')

    // Auto cleanup old room after 2 hours
    setTimeout(() => cleanupRoom(playload), 2 * 60 * 60 * 1000)
  } catch (error) {
    console.error('Error creating room:', error)
    res.status(500).json({ error: 'Failed to create room' })
  }
})




// socket coonection
io.on('connection', (socket) => {
  socket.on('connect', () => { console.log(` socket is connected ${socket.id}`)})
  
  socket.on("user-name", data => {
    try {
      // Validate input
      if (!data || !data.room || !data.name) return
      if (!rooms[data.room] || !games[data.room]) return

      const sanitizedName = sanitizeInput(data.name, 30)
      if (!sanitizedName) return

      const gameId = data.room
      const game = games[gameId]

      // Check if room is full
      if (game.clients.length >= parseInt(game.option)) return

      socket.join(data.room)
      rooms[data.room].users[socket.id] = sanitizedName

      const color = {"0": "#4285f4", "1": "#ea4335", "2": "#fbbc05", "3": "#34a853"}[game.clients.length]
      game.clients.push({
        "clientId": sanitizedName,
        "color": color
      })

      io.sockets.to(data.room).emit('list_of_user', game);

      // Start broadcasting when room is full
      let roomMax = parseInt(roomSize[game.option])
      if (game.clients.length === parseInt(game.option) && !game.started) {
        game.started = true
        updateGameState(gameId)
      }
    } catch (error) {
      console.error('Error in user-name event:', error)
    }
  })
  
  socket.on("update", data => {
    try {
      // Rate limiting
      if (!checkRateLimit(socket.id)) {
        return
      }

      // Validate input
      if (!data || !data.gameId || !data.ballId || !data.color || !data.clientId) return
      if (!games[data.gameId]) return

      const sanitizedName = sanitizeInput(data.clientId, 30)
      const gameId = data.gameId
      const ballId = sanitizeInput(data.ballId, 100)
      const color = sanitizeInput(data.color, 20)

      // Verify player is in this game
      const game = games[gameId]
      const playerExists = game.clients.some(c => c.clientId === sanitizedName)
      if (!playerExists) return

      // Update state
      if (!game.state) game.state = {}
      game.state[ballId] = {
        color: color,
        name: sanitizedName
      }
    } catch (error) {
      console.error('Error in update event:', error)
    }
  })

  socket.on("clear", data => {
    try {
      if (!data || !data.room || !data.name) return
      if (!games[data.room]) return

      const sanitizedName = sanitizeInput(data.name, 30)
      arr_check.push(sanitizedName)

      if (arr_check.length == parseInt(games[data.room].option)) {
        // Stop broadcasting for this game
        activeGames.delete(data.room)

        // Schedule cleanup after 5 minutes to allow players to see results
        setTimeout(() => cleanupRoom(data.room), 5 * 60 * 1000)
        arr_check = []
      }
    } catch (error) {
      console.error('Error in clear event:', error)
    }
  })

  socket.on('disconnect', () => {
    try {
      // Clean up rate limiting
      socketRateLimits.delete(socket.id)

      // Remove user from rooms
      getUserRoom(socket).forEach(room => {
        if (rooms[room] && rooms[room].users) {
          delete rooms[room].users[socket.id]
        }
      })
    } catch (error) {
      console.error('Error in disconnect event:', error)
    }
  })
})

function getUserRoom(socket) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[socket.id] != null) names.push(name)
    return names
  }, [])
}

function updateGameState(gameId) {
  // Only broadcast for active games
  if (!activeGames.has(gameId)) return

  try {
    const game = games[gameId]
    if (game) {
      io.sockets.to(game.id).emit('update', game);
    }
    // Continue broadcasting only if game is still active
    if (activeGames.has(gameId)) {
      setTimeout(() => updateGameState(gameId), 300);
    }
  } catch (error) {
    console.error('Error in updateGameState:', error)
    activeGames.delete(gameId)
  }
}

function cleanupRoom(roomId) {
  try {
    // Remove from active games
    activeGames.delete(roomId)

    // Clean up game and room data
    if (games[roomId]) {
      delete games[roomId]
    }
    if (rooms[roomId]) {
      delete rooms[roomId]
    }

    console.log(`Cleaned up room: ${roomId}`)
  } catch (error) {
    console.error('Error cleaning up room:', error)
  }
}

// Cryptographically secure GUID generation
function S4() {
  return crypto.randomBytes(2).toString('hex');
}
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();