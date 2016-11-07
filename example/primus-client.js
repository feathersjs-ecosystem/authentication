// This is what a NodeJS client looks like
const io = require('socket.io-client');
const feathers = require('feathers/client');
const socketio = require('feathers-socketio/client');
const hooks = require('feathers-hooks');
const authentication = require('feathers-authentication-client');
const localstorage = require('localstorage-memory');
const host = 'http://localhost:3030';
const socket = io(host);

const app = feathers()
  .configure(socketio(socket))
  .configure(hooks())
  .configure(authentication({ storage: localstorage }));

console.log('Feathers Socketio client attempting to authenticate.');

app.authenticate({
  strategy: 'local',
  email: 'admin@feathersjs.com',
  password: 'admin'
}).then(function(result){
  console.log(`Successfully authenticated against ${host}!`, result);

  return app.service('users').get(0).then(user => {
    console.log('Found user when authenticated', user);

    return new Promise((resolve, reject) => {
      setTimeout(function() {
        app.logout().then(() => {
          app.service('users').get(0).then(user => {
            console.log('Got User Unauthenticated Oh no!');
            resolve(user);
          }).catch(reject);
        });
      }, 2000);
    });
    
  });
}).catch(function(error){
  console.error('Error authenticating!', error);
});
