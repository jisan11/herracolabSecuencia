const socket = io()

/**
 * ============================= CONSTANTS =============================
 */
let message = document.getElementById('mySavedModel');
const inpUsername = document.querySelector('#inp-username'),
  inpRoom = document.querySelector('#inp-room'),
  inpMessage = document.querySelector('#inp-message'),
  btnSignup = document.querySelector('#btn-signup'),
  containerSignup = document.querySelector('#signup'),
  containerChat = document.querySelector('#chat'),
  roomNameHeader = document.querySelector('#room-name'),
  chatUsers = document.querySelector('#chat-users'),
  chatMessage = document.querySelector('#chat-message')

/**
 * ============================= FUNCTIONS =============================
 */

function joinRoom() {
  const username = inpUsername.value,
    roomName = inpRoom.value

  sessionStorage.setItem('username', username)
  socket.emit('join room', {id: socket.id, username, roomName })
}

function showRoom({ roomName, users }) {
  containerSignup.classList.add('hidden')
  containerChat.classList.remove('hidden')
  roomNameHeader.innerText = roomName
  fillUsersInRoom(users)
}

function fillUsersInRoom(users) {
  chatUsers.innerHTML = ''
  for(const user of users) {
    const classUserName = (user === sessionStorage.getItem('username')) ? 'me' : 'external',
      p = createTagP(user, 'user-info', classUserName)
    chatUsers.appendChild(p)
  }
}

function createTagP(text, ...classes) {
  const tagP = document.createElement('p')
  tagP.innerText = text
  classes.forEach(className => tagP.classList.add(className))
  return tagP
}

function sendMessage(e) {
  if(e.keyCode === 13) {
    socket.emit('message', e.target.value)
    e.target.value = ''
  }
}

function showMessage({ message, username }) {
  const classUserName = (username === sessionStorage.getItem('username')) ? 'local-message' : 'message',
    pUserMessage = createTagP(username, 'username-message', classUserName),
    pMessage = createTagP(message, classUserName)

  chatMessage.appendChild(pUserMessage)
  chatMessage.appendChild(pMessage)
}

/**
 * ============================= LISTENERS =============================
 */

btnSignup.addEventListener('click', joinRoom)
inpMessage.addEventListener('keyup', sendMessage)

socket.on('user joined', showRoom)
socket.on('user disconnect', showRoom)
socket.on('message', showMessage)

myDiagramDiv.addEventListener('click', function() {
    
  //emite los datos al servidor mediante emit y evento que cree chat:message
  socket.emit('chat:message', message.value);
});

myPaletteDiv.addEventListener('click', function() {
    
  //emite los datos al servidor mediante emit y evento que cree chat:message
  socket.emit('chat:message', message.value);
});

//escucha o recibe los datos json de chat:message
socket.on('chat:message', function(data) {
  load(data);
  message.innerHTML = data; 
});



///////////////////////////////////////////////////////////////////////////
// const socket = io();

// const message = document.getElementById('mySavedModel');
// const inpUsername = document.querySelector('#inp-username');
// const inpRoom = document.querySelector('#inp-room');
// const inpMessage = document.querySelector('#inp-message');
// const btnSignup = document.querySelector('#btn-signup');
// const containerSignup = document.querySelector('#signup');
// const containerChat = document.querySelector('#chat');
// const roomNameHeader = document.querySelector('#room-name');
// const chatUsers = document.querySelector('#chat-users');
// const chatMessage = document.querySelector('#chat-message');

// function joinRoom() {
//   const username = inpUsername.value;
//   const roomName = inpRoom.value;

//   sessionStorage.setItem('username', username);
//   socket.emit('join room', { id: socket.id, username, roomName });
// }

// function showRoom({ roomName, users }) {
//   containerSignup.classList.add('hidden');
//   containerChat.classList.remove('hidden');
//   roomNameHeader.innerText = roomName;
//   fillUsersInRoom(users);
// }

// function fillUsersInRoom(users) {
//   chatUsers.innerHTML = '';
//   for (const user of users) {
//     const classUserName = (user === sessionStorage.getItem('username')) ? 'me' : 'external';
//     const p = createTagP(user, 'user-info', classUserName);
//     chatUsers.appendChild(p);
//   }
// }

// function createTagP(text, ...classes) {
//   const tagP = document.createElement('p');
//   tagP.innerText = text;
//   classes.forEach(className => tagP.classList.add(className));
//   return tagP;
// }

// function sendMessage(e) {
//   if (e.keyCode === 13) {
//     socket.emit('chat:message', e.target.value);
//     e.target.value = '';
//   }
// }

// function showMessage({ message, username }) {
//   const classUserName = (username === sessionStorage.getItem('username')) ? 'local-message' : 'message';
//   const pUserMessage = createTagP(username, 'username-message', classUserName);
//   const pMessage = createTagP(message, classUserName);

//   chatMessage.appendChild(pUserMessage);
//   chatMessage.appendChild(pMessage);
// }

// btnSignup.addEventListener('click', joinRoom);
// inpMessage.addEventListener('keyup', sendMessage);

// socket.on('user joined', showRoom);
// socket.on('user disconnect', showRoom);
// socket.on('message', showMessage);

// myDiagramDiv.addEventListener('click', function () {
//   // Emitir datos para gráficos
//   socket.emit('graphic:message', message.value);
// });

// myPaletteDiv.addEventListener('click', function () {
//   // Emitir datos para gráficos desde el panel
//   socket.emit('graphic:message', message.value);
// });

// socket.on('graphic:message', function (data) {
//   // Manejar datos recibidos para gráficos
//   load(data);
//   message.innerHTML = data;
// });


