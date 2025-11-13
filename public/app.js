// Use window.location to connect to the current server (works in dev and production)
const socket = io.connect(window.location.origin)
const div = document.getElementById('list')
const divBoard = document.getElementById("divBoard")
const demo = document.getElementById('demo')
const wwcd = document.getElementById('wwcd')
const one = document.getElementById('one')
const two = document.getElementById('two')
const three = document.getElementById('three')
const four = document.getElementById('four')

let speech = new SpeechSynthesisUtterance();
speech.lang = 'en';
speech.rate = 1;
speech.volume = 1;
speech.pitch = 1;

let keys = null, timer = null, name = null, playerColor = null, getnumber = null
let aa = 0, bb = 0, cc = 0, dd = 0, ballno = 0, no_of_user = 0
let name_arr = [], show_list = []
let lastClickTime = 0
const CLICK_DEBOUNCE = 100 // 100ms debounce

// Sanitize user input to prevent XSS
function sanitizeInput(input) {
  if (!input) return ''
  const div = document.createElement('div')
  div.textContent = input
  return div.innerHTML
} 

  if (!name) {
    name = prompt("What is your name?")
  }
  // socket connection
  while (!name || name.trim().length == 0) {
    name = prompt("What is your name?")
  }
  // Sanitize and limit name length
  name = sanitizeInput(name.trim().substring(0, 30))

  socket.emit("user-name", {
    name: name,
    room: gameRoom
  })

  socket.on('update', data => {
    if (!data.state) return;
    for (const b of Object.keys(data.state)) {
      const color = sanitizeInput(data.state[b].color);
      const ballObject = document.getElementById(b);
      if (ballObject) {
        const playerName = sanitizeInput(data.state[b].name)
        ballObject.textContent = playerName
        ballObject.value = playerName
        ballObject.style.backgroundColor = color
      }
    }
  })

  socket.on('list_of_user', data => {
    timer = data.timer
    ballno = data.balls
    no_of_user = data.option
    keys = data.keys
    getnumber = data.getnumber
    while (div.firstChild)
      div.removeChild(div.firstChild)
    name_arr = []
    data.clients.forEach(c => {
      const newdiv = document.createElement("div");
      newdiv.style.width = "100px";
      newdiv.setAttribute("class", "inside")
      const sanitizedColor = sanitizeInput(c.color)
      const sanitizedName = sanitizeInput(c.clientId)
      newdiv.style.color = sanitizedColor
      newdiv.textContent = sanitizedName
      name_arr.push(sanitizedName)
      if (name_arr.length === parseInt(no_of_user)) {
        $('#lead').fadeOut()
        divBoard.style.display = "block"
        start_timer(ballno)
      }
      div.appendChild(newdiv)
      if (sanitizedName === name) playerColor = sanitizedColor
    })
    // board
    while (divBoard.firstChild)
      divBoard.removeChild(divBoard.firstChild)

    for (let i = 0; i < data.balls; i++) {
      const b = document.createElement("button");
      b.id = keys + i + getnumber
      b.textContent = i + 1
      b.setAttribute("class", "btnn")
      b.addEventListener("click", e => {
        // Debounce clicks
        const now = Date.now()
        if (now - lastClickTime < CLICK_DEBOUNCE) return
        lastClickTime = now

        b.style.background = playerColor
        const payLoad = {
          "clientId": name,
          "gameId": gameRoom,
          "ballId": b.id,
          "color": playerColor
        }
        socket.emit('update', payLoad)
      })
      divBoard.appendChild(b);
    }
  })

  function start_timer(n) {

    let x = setInterval(function () {
      demo.innerText = timer
      timer -= 1
      if (timer < 0) {
        clearInterval(x);
        divBoard.style.display = "none"
        $('#demo').fadeOut()
        show_win(n)
      }
    }, 1000)
  }

  function show_win(n) {
    // Count scores for each player
    const scores = [0, 0, 0, 0]

    for (let j = 0; j < n; j++) {
      const ballElement = document.getElementById(keys + j + getnumber)
      if (ballElement && ballElement.value) {
        const value = ballElement.value
        show_list.push(value)

        // Find which player owns this ball
        const playerIndex = name_arr.indexOf(value)
        if (playerIndex !== -1 && playerIndex < 4) {
          scores[playerIndex]++
        }
      }
    }

    // Update score variables for display
    aa = scores[0]
    bb = scores[1]
    cc = scores[2]
    dd = scores[3]

    socket.emit("clear", { room: gameRoom, name: name })

    // Find winner using array methods (more efficient and scalable)
    const maxScore = Math.max(...scores.slice(0, parseInt(no_of_user)))
    const winners = []

    for (let i = 0; i < parseInt(no_of_user); i++) {
      if (scores[i] === maxScore) {
        winners.push(i)
      }
    }

    // Check for draw
    if (winners.length > 1) {
      wwcd.textContent = 'Draw match'
      to_speak('Draw match', 0)
    } else {
      const winnerName = sanitizeInput(name_arr[winners[0]])
      wwcd.textContent = `Winner winner chicken dinner ${winnerName}`
      to_speak(`Winner winner chicken dinner ${winnerName}`, parseInt(no_of_user))
    }
  }

  function show_result(n) {
    if (n == 0) return

    // Sanitize names when displaying scores
    const elements = [one, two, three, four]
    const scores = [aa, bb, cc, dd]

    for (let i = 0; i < n && i < 4; i++) {
      if (name_arr[i] && elements[i]) {
        const sanitizedName = sanitizeInput(name_arr[i])
        elements[i].textContent = `${sanitizedName} score is ${scores[i]}`
      }
    }
  }

  function to_speak(texts, num) {
    speech.text = texts
    window.speechSynthesis.speak(speech);
    show_result(num)
  }