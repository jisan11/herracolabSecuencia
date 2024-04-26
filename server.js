const express = require('express');
const  path = require('path');
const app = express();
  http = require('http').Server(app),
  //io = require('socket.io')(http)

//app.use(express.static(path.join(__dirname, './public')));
app.use(express.static(path.join(__dirname, 'public')));
//static files
//app.use(express.static(path.join(__dirname, './public')));

app.get('/', (req, res) => {
  res.sendFile('index.html', {root: __dirname})
})

//settings
//http.listen(3000, () => console.log('Server on'))
app.set('port', process.env.PORT || 3000);

//iniciar servidor
const server = app.listen(app.get('port'),()=>{
  console.log('server on port', app.get('port'));
});

//websocket
const SocketIO = require('socket.io');
const io = SocketIO(server);

/**
  rooms { 
    'roomName 1': {
        'id 1': 'username 1',
        'id 2': 'username 2'
    },
    'roomName 2': {
        'id 1': 'username 1',
        'id 2': 'username 2'
    },
  }
*/
const rooms = {}
io.on('connection', socket => {
  console.log('new connection', socket.id);
  
  socket.on('chat:message', (data) => {
    //envia los datos a todos los navegadores conectados, tambien se puede configurar para algunos
    socket.broadcast.emit('chat:message', data);
  });

  socket.on('join room', ({id, username, roomName}) => {
    socket.join(roomName)
    saveDataRoom(id, username, roomName)
    io.sockets.in(roomName).emit('user joined', {roomName, users: getUsersFromRoom(roomName)})
  })

  socket.on('message', message => {
    const { roomName, username }= searchInfoBySocketId(socket.id)
    io.sockets.in(roomName).emit('message', { message, username })
  })

  socket.on('disconnect', () => {
    const { roomName } = searchInfoBySocketId(socket.id)
    deleteUserFromRoom(socket.id, roomName)
    io.sockets.in(roomName).emit('user disconnect', { roomName, users: getUsersFromRoom(roomName) })
  })
})

function saveDataRoom(id, username, roomName) {
  let room = rooms[roomName]
  if(!room) {
    room = rooms[roomName] = {}
  }
  room[id] = username
}

function getUsersFromRoom(roomName) {
  if(rooms[roomName]) {
    return Object.values(rooms[roomName])
  }

  return []
}

function searchInfoBySocketId(socketId) {
  for(const roomName in rooms) {
    const existInRoom = socketId in rooms[roomName]
    if(existInRoom) {
      return { roomName, username: rooms[roomName][socketId] }
    }
  }

  return { roomName: null, username: null }
}

function deleteUserFromRoom(socketId, roomName) {
  if(roomName && socketId in rooms[roomName]) {
    delete rooms[roomName][socketId]
  }
}


//////////////////////////////////////////////////////////////////////////
// const express = require('express');
// const path = require('path');
// const SocketIO = require('socket.io');

// const app = express();
// const server = require('http').Server(app);
// const io = SocketIO(server);

// // Configurar directorio de archivos estáticos
// app.use(express.static(path.join(__dirname, 'public')));

// // Configurar ruta principal
// app.get('/', (req, res) => {
//   res.sendFile('index.html', { root: __dirname });
// });

// // Configurar puerto del servidor
// app.set('port', process.env.PORT || 3000);

// // Iniciar servidor
// server.listen(app.get('port'), () => {
//   console.log('Servidor en el puerto', app.get('port'));
// });

// // Manejar conexiones de sockets
// const rooms = {};

// io.on('connection', socket => {
//   console.log('Nueva conexión', socket.id);
  
//   socket.on('chat:message', (data) => {
//     socket.broadcast.emit('chat:message', data);
//   });

//   socket.on('graphic:message', (data) => {
//     socket.broadcast.emit('graphic:message', data);
//   });

//   socket.on('join room', ({ id, username, roomName }) => {
//     socket.join(roomName);
//     saveDataRoom(id, username, roomName);
//     io.sockets.in(roomName).emit('user joined', { roomName, users: getUsersFromRoom(roomName) });
//   });

//   socket.on('message', message => {
//     const { roomName, username } = searchInfoBySocketId(socket.id);
//     io.sockets.in(roomName).emit('message', { message, username });
//   });

//   socket.on('disconnect', () => {
//     const { roomName } = searchInfoBySocketId(socket.id);
//     deleteUserFromRoom(socket.id, roomName);
//     io.sockets.in(roomName).emit('user disconnect', { roomName, users: getUsersFromRoom(roomName) });
//   });
// });

// function saveDataRoom(id, username, roomName) {
//   let room = rooms[roomName];
//   if (!room) {
//     room = rooms[roomName] = {};
//   }
//   room[id] = username;
// }

// function getUsersFromRoom(roomName) {
//   return rooms[roomName] ? Object.values(rooms[roomName]) : [];
// }

// function searchInfoBySocketId(socketId) {
//   for (const roomName in rooms) {
//     const existInRoom = socketId in rooms[roomName];
//     if (existInRoom) {
//       return { roomName, username: rooms[roomName][socketId] };
//     }
//   }
//   return { roomName: null, username: null };
// }

// function deleteUserFromRoom(socketId, roomName) {
//   if (roomName && socketId in rooms[roomName]) {
//     delete rooms[roomName][socketId];
//   }
// }
