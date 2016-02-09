export let getCookie = function(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) return parts.pop().split(";").shift();
}

export let getUser = function() {
  // TODO (EK): Maybe make this configurable
  const key = 'feathers-user';
  let user = localStorage.getItem(key);

  return user;
}

export let getToken = function() {
  // TODO (EK): Maybe make this configurable
  const key = 'feathers-jwt';
  let token = localStorage.getItem(key);

  if (token) {
    return token;
  }

  // We don't have the token so try and fetch it from the cookie
  // and store it in local storage.
  // TODO (EK): Maybe we should clear the cookie
  token = getCookie(key);

  if (token) {
    localStorage.setItem(key, token);
  }

  return token;
}

export default {
  getUser,
  getToken,
  getCookie
}