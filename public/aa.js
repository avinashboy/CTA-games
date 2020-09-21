const socket = io.connect("https://hot-games.herokuapp.com"),
  div = document.getElementById("list"),
  divBoard = document.getElementById("divBoard"),
  demo = document.getElementById("demo"),
  wwcd = document.getElementById("wwcd"),
  one = document.getElementById("one"),
  two = document.getElementById("two"),
  three = document.getElementById("three"),
  four = document.getElementById("four");
let speech = new SpeechSynthesisUtterance;
speech.lang = "en", speech.rate = 1, speech.volume = 1, speech.pitch = 1;
let keys = null,
  timer = null,
  name = null,
  playerColor = null,
  getnumber = null,
  aa = 0,
  bb = 0,
  cc = 0,
  dd = 0,
  ballno = 0,
  no_of_user = 0,
  name_arr = [],
  show_list = [];

function start_timer(e) {
  let n = setInterval(function () {
    demo.innerText = timer, (timer -= 1) < 0 && (clearInterval(n), divBoard.style.display = "none", $("#demo").fadeOut(), show_win(e))
  }, 1e3)
}

function show_win(e) {
  for (let n = 0; n < e; n++) {
    let e = document.getElementById(keys + n + getnumber).value;
    "" == e || show_list.push(e)
  }
  show_list.forEach(function (e) {
    e === name_arr[0] && (aa += 1);
    e === name_arr[1] && (bb += 1);
    e === name_arr[2] && (cc += 1);
    e === name_arr[3] && (dd += 1)
  }), socket.emit("clear", {
    room: gameRoom,
    name: name
  }), aa > bb && aa > cc && aa > dd && (wwcd.innerText = `Winner winner chicken dinner ${name_arr[0]}`, to_speak(`Winner winner chicken dinner ${name_arr[0]}`, parseInt(no_of_user))), bb > aa && bb > cc && bb > dd && (wwcd.innerText = `Winner winner chicken dinner ${name_arr[1]}`, to_speak(`Winner winner chicken dinner ${name_arr[1]}`, parseInt(no_of_user))), cc > aa && cc > bb && cc > dd && (wwcd.innerText = `Winner winner chicken dinner ${name_arr[2]}`, to_speak(`Winner winner chicken dinner ${name_arr[2]}`, parseInt(no_of_user))), dd > aa && dd > bb && dd > cc && (wwcd.innerText = `Winner winner chicken dinner ${name_arr[3]}`, to_speak(`Winner winner chicken dinner ${name_arr[3]}`, parseInt(no_of_user))), aa == bb && 2 == parseInt(no_of_user) && (wwcd.innerText = "Draw match", to_speak("Draw match", 0)), aa == bb && bb == cc && aa == cc && 3 == parseInt(no_of_user) && (wwcd.innerText = "Draw match", to_speak("Draw match", 0)), aa == bb && bb == cc && cc == dd && aa == cc && aa == dd && bb == dd && 4 == parseInt(no_of_user) && (wwcd.innerText = "Draw match", to_speak("Draw match", 0))
}

function show_result(e) {
  0 != e && (2 == e && (two.innerText = `${name_arr[1]} score is ${bb}`, one.innerText = `${name_arr[0]} score is ${aa}`), 3 == e && (two.innerText = `${name_arr[1]} score is ${bb}`, one.innerText = `${name_arr[0]} score is ${aa}`, three.innerText = `${name_arr[2]} score is ${cc}`), 4 == e && (two.innerText = `${name_arr[1]} score is ${bb}`, one.innerText = `${name_arr[0]} score is ${aa}`, three.innerText = `${name_arr[2]} score is ${cc}`, four.innerText = `${name_arr[3]} score is ${dd}`))
}

function to_speak(e, n) {
  speech.text = e, window.speechSynthesis.speak(speech), show_result(n)
}
name || (name = prompt("What is your name?")), 0 == name.length && (name = prompt("What is your name?")), socket.emit("user-name", {
  name: name,
  room: gameRoom
}), socket.on("update", e => {
  if (e.state)
    for (const n of Object.keys(e.state)) {
      const t = e.state[n].color,
        r = document.getElementById(n);
      r.innerText = e.state[n].name, r.value = e.state[n].name, r.style.backgroundColor = t
    }
}), socket.on("list_of_user", e => {
  for (timer = e.timer, ballno = e.balls, no_of_user = e.option, keys = e.keys, getnumber = e.getnumber; div.firstChild;) div.removeChild(div.firstChild);
  for (name_arr = [], e.clients.forEach(e => {
      const n = document.createElement("div");
      n.style.width = "100px", n.setAttribute("class", "inside"), n.style.color = e.color, n.textContent = e.clientId, name_arr.push(e.clientId), name_arr.length === parseInt(no_of_user) && ($("#lead").fadeOut(), divBoard.style.display = "block", start_timer(ballno)), div.appendChild(n), e.clientId === name && (playerColor = e.color)
    }); divBoard.firstChild;) divBoard.removeChild(divBoard.firstChild);
  for (let n = 0; n < e.balls; n++) {
    const e = document.createElement("button");
    e.id = keys + n + getnumber, e.textContent = n + 1, e.setAttribute("class", "btnn"), e.addEventListener("click", n => {
      e.style.background = playerColor;
      const t = {
        clientId: name,
        gameId: gameRoom,
        ballId: e.id,
        color: playerColor
      };
      socket.emit("update", t)
    }), divBoard.appendChild(e)
  }
});