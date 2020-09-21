const socket = io.connect("http://localhost:2233")
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

  if (!name) {
    name = prompt("What is your name?")
  }
  // socket connection
  if (name.length == 0) {
    name = prompt("What is your name?")
  }
  socket.emit("user-name", {
    name: name,
    room: gameRoom
  })

  socket.on('update', data => {
    if (!data.state) return;
    for (const b of Object.keys(data.state)) {
      const color = data.state[b].color;
      const ballObject = document.getElementById(b);
      ballObject.innerText = data.state[b].name
      ballObject.value = data.state[b].name
      ballObject.style.backgroundColor = color
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
      newdiv.style.color = c.color
      newdiv.textContent = c.clientId
      name_arr.push(c.clientId)
      if (name_arr.length === parseInt(no_of_user)) {
        $('#lead').fadeOut()
        divBoard.style.display = "block"
        start_timer(ballno)
      }
      div.appendChild(newdiv)
      if (c.clientId === name) playerColor = c.color
    })
    // board
    while (divBoard.firstChild)
      divBoard.removeChild(divBoard.firstChild)

    for (let i = 0; i < data.balls; i++) {
      const b = document.createElement("button");
      b.id = keys + i + getnumber
      // b.tags = keys + i + getnumber
      b.textContent = i + 1
      b.setAttribute("class", "btnn")
      b.addEventListener("click", e => {
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
    for (let j = 0; j < n; j++) {
      let ba = document.getElementById(keys + j + getnumber).value
      if (ba == "") {

      } else {
        show_list.push(ba)
      }
    }
    show_list.forEach(show_win)

    function show_win(value) {
      if (value === name_arr[0]) {
        aa += 1
      }
      if (value === name_arr[1]) {
        bb += 1
      }
      if (value === name_arr[2]) {
        cc += 1
      }
      if (value === name_arr[3]) {
        dd += 1
      }

    }
    socket.emit("clear", { room: gameRoom, name: name })

    if (aa > bb && aa > cc && aa > dd) {
      wwcd.innerText = `Winner winner chicken dinner ${name_arr[0]}`
      to_speak(`Winner winner chicken dinner ${name_arr[0]}`, parseInt(no_of_user))
    }

    if (bb > aa && bb > cc && bb > dd) {
      wwcd.innerText = `Winner winner chicken dinner ${name_arr[1]}`
      to_speak(`Winner winner chicken dinner ${name_arr[1]}`, parseInt(no_of_user))
    }

    if (cc > aa && cc > bb && cc > dd) {
      wwcd.innerText = `Winner winner chicken dinner ${name_arr[2]}`
      to_speak(`Winner winner chicken dinner ${name_arr[2]}`, parseInt(no_of_user))
    }

    if (dd > aa && dd > bb && dd > cc) {
      wwcd.innerText = `Winner winner chicken dinner ${name_arr[3]}`
      to_speak(`Winner winner chicken dinner ${name_arr[3]}`, parseInt(no_of_user))
    }

    // for draw game
    if (aa == bb && parseInt(no_of_user) == 2) {
      wwcd.innerText = `Draw match`
      to_speak(`Draw match`, 0)
    }
    if (aa == bb && bb == cc && aa == cc && parseInt(no_of_user) == 3) {
      wwcd.innerText = `Draw match`
      to_speak(`Draw match`, 0)
    }
    if (aa == bb && bb == cc && cc == dd && aa == cc && aa == dd && bb == dd && parseInt(no_of_user) == 4) {
      wwcd.innerText = `Draw match`
      to_speak(`Draw match`, 0)
    }

  }

  function show_result(n) {
    if (n == 0) return

    if (n == 2) {
      two.innerText = `${name_arr[1]} score is ${bb}`
      one.innerText = `${name_arr[0]} score is ${aa}`
    }

    if (n == 3) {
      two.innerText = `${name_arr[1]} score is ${bb}`
      one.innerText = `${name_arr[0]} score is ${aa}`
      three.innerText = `${name_arr[2]} score is ${cc}`
    }

    if (n == 4) {
      two.innerText = `${name_arr[1]} score is ${bb}`
      one.innerText = `${name_arr[0]} score is ${aa}`
      three.innerText = `${name_arr[2]} score is ${cc}`
      four.innerText = `${name_arr[3]} score is ${dd}`
    }
  }

  function to_speak(texts, num) {
    speech.text = texts
    window.speechSynthesis.speak(speech);
    show_result(num)
  }