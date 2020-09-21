var element = new Image,
  devtoolsOpen = !1;
element.__defineGetter__("id", function () {
  devtoolsOpen = !0
}), setInterval(function () {
  devtoolsOpen = !1, console.log(element), devtoolsOpen && alert("Close your dev tool")
}, 1), $(document).bind("contextmenu", function (e) {
  e.preventDefault()
}), $(document).keydown(function (e) {
  if (123 === e.which) return !1
}), document.onkeydown = function (e) {
  return 123 != event.keyCode && ((!e.ctrlKey || e.keyCode != "E".charCodeAt(0)) && ((!e.ctrlKey || !e.shiftKey || e.keyCode != "I".charCodeAt(0)) && ((!e.ctrlKey || !e.shiftKey || e.keyCode != "J".charCodeAt(0)) && ((!e.ctrlKey || e.keyCode != "U".charCodeAt(0)) && ((!e.ctrlKey || e.keyCode != "S".charCodeAt(0)) && ((!e.ctrlKey || e.keyCode != "H".charCodeAt(0)) && ((!e.ctrlKey || e.keyCode != "A".charCodeAt(0)) && ((!e.ctrlKey || e.keyCode != "F".charCodeAt(0)) && ((!e.ctrlKey || e.keyCode != "E".charCodeAt(0)) && void 0)))))))))
}, document.addEventListener ? document.addEventListener("contextmenu", function (e) {
  e.preventDefault()
}, !1) : document.attachEvent("oncontextmenu", function () {
  window.event.returnValue = !1
});