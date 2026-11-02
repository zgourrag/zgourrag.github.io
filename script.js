// Clock
function updateClock() {
  const now = new Date();
  document.getElementById('systemClock').innerText = now.toLocaleTimeString('en-GB', {
    timeZone: 'Africa/Casablanca', 
    hour: '2-digit', 
    minute: '2-digit'
  });
}
setInterval(updateClock, 1000);
updateClock();

// Start Menu
function toggleStartMenu() {
  const menu = document.getElementById('startMenu');
  menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}

// Window Management
let highestZ = 10;

function openWindow(id) {
  const win = document.getElementById('window-' + id);
  win.style.display = 'block';
  focusWindow(win);
}

function closeWindow(id) {
  document.getElementById('window-' + id).style.display = 'none';
}

function focusWindow(win) {
  highestZ++;
  win.style.zIndex = highestZ;
}

// Make Windows Draggable
document.querySelectorAll('.window').forEach(win => {
  win.addEventListener('mousedown', () => focusWindow(win));
  dragElement(win);
});

function dragElement(elmnt) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  const header = elmnt.querySelector('.window-header');
  
  if (header) {
    header.onmousedown = dragMouseDown;
  } else {
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}