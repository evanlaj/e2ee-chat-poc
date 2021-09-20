const chatInput = document.getElementById("chat-input");
const chatButton = document.getElementById("button-chat-input");
const userList = document.getElementById("user-list");

const users = [];

const socket = io();

//These 3 lines allow us to get the username of the user from the URL parameters
const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());
const username = params.user.substring(0,16);

var activeRoom = null;
var activeHistory = null;

socket.emit('join-service', username);

chatInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessageToCurrentRoom();
    }
});

chatButton.addEventListener('click', (e) => {
  e.preventDefault();
  sendMessageToCurrentRoom();
});

function createChatHistory(id) {

  let user = users.find(user => user.id === id);

  let history = document.createElement('div');
  history.id = 'history-' + id;
  history.className = 'chat-history';

  let header = document.createElement('div');
  header.className = 'chat-history-header';

  let icon = document.createElement('div');
  icon.className = "chh-icon";
  icon.appendChild(document.createTextNode(user.username[0]));

  let name = document.createElement('div');
  name.className = "chh-name";
  name.appendChild(document.createTextNode(user.username));

  header.appendChild(icon);
  header.appendChild(name);

  history.appendChild(header);

  document.getElementById('right-panel').appendChild(history);
}

function sendMessageToCurrentRoom() {

  if (activeRoom == null) return;

  var message = chatInput.value;

  if (message ==  '') return;

  console.log("sending '" + message + "' to " + activeRoom);

  let encryptedMessage = encrypt(getRoom(activeRoom).sharedKey, message);

  socket.emit('chat-message', {recipient: activeRoom, text: encryptedMessage})

  chatInput.value = "";
  chatInput.focus();

  let messageWrapper = document.createElement('div');
  messageWrapper.className = 'message-wrapper';

  let messageSent = document.createElement('div');
  messageSent.className = 'sent';
  messageSent.appendChild(document.createTextNode(message));

  messageWrapper.appendChild(messageSent);

  activeHistory.appendChild(messageWrapper);

  activeHistory.scrollTop = 1000000;
}

function receiveMessage(userId, message) {

  let decryptedMessage = decrypt(getRoom(userId).sharedKey, message);

  let chatHistory = document.getElementById('history-' + userId);

  let messageWrapper = document.createElement('div');
  messageWrapper.className = 'message-wrapper';

  let messageReceived = document.createElement('div');
  messageReceived.className = 'received';
  messageReceived.appendChild(document.createTextNode(decryptedMessage));

  messageWrapper.appendChild(messageReceived);

  chatHistory.appendChild(messageWrapper);

  chatHistory.scrollTop = 1000000;

  console.log("received '" + decryptedMessage + "' from " + userId);

  if(chatHistory != activeHistory) {
    let userButton = document.getElementById(userId);

    let newMessages = (userButton.hasAttribute('newMessages')?parseInt(userButton.getAttribute('newMessages')):0);

    userButton.setAttribute('newMessages', ++newMessages);
  }
}

function startRoom(id) {

  let room = getRoom(id);

  if(room == undefined) {
    let keys = generateKeyPair();

    createRoom(id, keys.private, keys.public);

    publicKeyString = (keys.public + "").replace('n', '');

    socket.emit('start-room', {userId: id, key: publicKeyString});
  }

  let chatHistory = document.getElementById('history-' + id);

  if(chatHistory == null) {
    createChatHistory(id);
  }

  let userButton = document.getElementById(id);
  userButton.removeAttribute('newMessages');

  setActiveRoom(id);
}

function setActiveRoom(id) {
  if (activeRoom != null) activeHistory.removeAttribute('activeRoom');

  activeRoom = id;

  activeHistory = document.getElementById('history-' + id);
  activeHistory.setAttribute('activeRoom', '');
}

// SOCKETS BEHAVIORS

socket.on('key-exchange-1', (req) => {

  let keys = generateKeyPair();

  createRoom(req.userId, keys.private, keys.public);

  let chatHistory = document.getElementById('history-' + req.userId);

  if(chatHistory == null) {
    createChatHistory(req.userId);
  }

  publicKeyString = (keys.public + "").replace('n', '');

  socket.emit('key-exchange-2', {userId: req.userId, key: publicKeyString});

  let receivedKey = BigInt(req.key);

  let sharedKey = generateSharedKey(keys.private, receivedKey);

  setSharedKey(req.userId, sharedKey + "");

  console.log('Your shared key with ' + req.userId + ' is ' + sharedKey);
});

socket.on('key-exchange-2', (req) => {
  let receivedKey = BigInt(req.key);

  let room = getRoom(req.userId);
  let sharedKey = generateSharedKey(room.privateKey, receivedKey);

  setSharedKey(req.userId, sharedKey + "");

  console.log('Your shared key with ' + req.userId + ' is ' + sharedKey);
});

socket.on('chat-message', (message) => {
  receiveMessage(message.sender, message.text);
});

socket.on('new-user', (user) => {
  console.log(user.username + '(' + user.id + ') has joined the chat');

  users.push(user);

  var userButton = document.createElement('button');
  userButton.id = user.id;
  userButton.className = "user-button";

  userButton.addEventListener("click", (e) => {
    startRoom(user.id);
    chatInput.focus();
  });

  var userIcon = document.createElement('div');
  userIcon.className = "user-icon";
  userIcon.appendChild(document.createTextNode(user.username[0]));

  userButton.appendChild(userIcon);
  userButton.appendChild(document.createTextNode(user.username));

  userList.appendChild(userButton);
});

socket.on('user-left', (user) => {

  if (user == null) return;

  console.log(user.username + '(' + user.id + ') has left the chat');


  userIdIndex = users.indexOf(user);

  users.splice(userIdIndex, 1);

  document.getElementById(user.id).remove();
});
