const users = [];

function userJoin(id, username) {
  const user = {id, username};

  users.push(user);

  return user;
}

function userLeave(id) {
  const user = getUser(id);
  const username = (user != undefined ? user.username : null);
  const index = users.indexOf(user);

  if(index > -1) users.splice(index, 1);

  return username;
}

function getUser(id) {
  return users.find(user => user.id === id);
}

function getUsers() {
  return users;
}

module.exports = {
  userJoin,
  userLeave,
  getUser,
  getUsers
};
