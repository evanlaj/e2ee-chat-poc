const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const { userJoin, userLeave, getUser, getUsers } = require("./users.js");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {

  socket.on('join-service', (username) => {
    console.log(username + " (" + socket.id + ") has joined the server");

    socket.broadcast.emit('new-user', {username : username, id : socket.id});

    sendUsers(socket);
    userJoin(socket.id, username);
  });

  socket.on('disconnect', () => {
    let username = userLeave(socket.id);

    console.log(username + " (" + socket.id + ") has left the server");
    io.emit('user-left',  {username : username, id : socket.id});
  });

  socket.on('start-room', (req) => {
    let recipient = io.sockets.sockets.get(req.userId);
    if(recipient) recipient.emit('key-exchange-1', {userId: socket.id, key: req.key});
  });

  socket.on('key-exchange-2', (req) => {
    let recipient = io.sockets.sockets.get(req.userId);
    if(recipient) recipient.emit('key-exchange-2', {userId: socket.id, key: req.key});
  });

  socket.on('chat-message', (message) => {
    let recipient = io.sockets.sockets.get(message.recipient);
    if(recipient) recipient.emit('chat-message', {sender: socket.id, text: message.text});
  });
});

//This function is used to send a list of all the current users to a newly connected socket
function sendUsers(socket) {
  for(user of getUsers()) {
    socket.emit('new-user', {username : user.username, id : user.id});
  }
}

//Start the server
const PORT = 3001 || process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
