var feathers = require('feathers');
var rest = require('feathers-rest');
var socketio = require('feathers-socketio');
var primus = require('feathers-primus');
var hooks = require('feathers-hooks');
var memory = require('feathers-memory');
var MemoryStore = require('passwordless-memorystore');
var bodyParser = require('body-parser');
var authentication = require('../../lib/index');
var authHooks = require('../../lib/index').hooks;

// Initialize the application
var app = feathers();

app.configure(rest())
  // .configure(primus({
  //   transformer: 'websockets'
  // }))
  .configure(socketio())
  .configure(hooks())
  // Needed for parsing bodies (login)
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  // Configure feathers-authentication
  .configure(authentication({
    token: {
      secret: 'feathers-rocks'
    },
    passwordless: {
      userEndpoint: '/api/users',
      tokenStore: new MemoryStore(),
      // Just logs the login URL
      deliveryMethods: [
        function(tokenToSend, uidToSend, recipient, callback){
          console.log('\n\nYou can now access your account here: "http://localhost:3030/auth/passwordless?token=' + tokenToSend + '&uid=' + encodeURIComponent(uidToSend) + '"\nOr you can use the token "' + tokenToSend + '" and uid in the form at http://localhost:3030');
          callback(null);
        }
      ]
    },
    local: false // Disable local auth
  }))
  // Initialize a user service
  .use('/api/users', memory({
    startId: 1
  }))
  // A simple Message service that we can used for testing
  .use('/messages', memory())
  .use('/', feathers.static(__dirname + '/public'))
  .use(function(error, req, res, next){
    res.status(error.code);
    res.json(error);
  });

var messageService = app.service('/messages');
messageService.create({text: 'A million people walk into a Silicon Valley bar'}, {}, function(){});
messageService.create({text: 'Nobody buys anything'}, {}, function(){});
messageService.create({text: 'Bar declared massive success'}, {}, function(){});

messageService.before({
  all: [
    authHooks.verifyToken({secret: 'feathers-rocks'}),
    authHooks.populateUser(),
    authHooks.requireAuth()
  ]
});

var userService = app.service('api/users');

// Add a hook to the user service that automatically replaces 
// the password with a hash of the password before saving it.
userService.before({
  create: authHooks.hashPassword()
});

// Create a user that we can use to log in

userService.create({email: 'admin@feathersjs.com'}, {}).then(function(user) {
  console.log('Created default user', user);
});
userService.create({email: 'admin2@feathersjs.com'}, {}).then(function(user) {
  console.log('Created default user', user);
});

app.listen(3030);

console.log('Feathers authentication app started on 127.0.0.1:3030');
