const roomList = [];

function createRoom(userId, privateKey, publicKey) {

  let room = {userId: userId, privateKey: privateKey, publicKey: publicKey, sharedKey: null}
  roomList.push(room);

  return room;
}

//Since we have no use for the private and public keys once the shared key is
//generated, we remove them from memory.
function setSharedKey(userId, sharedKey) {
  let room = getRoom(userId);

  room.privateKey = null;
  room.publicKey = null;
  room.sharedKey = sharedKey;
}

//Useful to get the shared key associated with another user.
function getRoom(userId) {
    return roomList.find(room => room.userId === userId);
}
