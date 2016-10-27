var feathers = require('feathers');
var rest = require('feathers-rest');
var socketio = require('feathers-socketio');
var hooks = require('feathers-hooks');
var memory = require('feathers-memory');
var passport = require('feathers-passport');
var bodyParser = require('body-parser');
var errorHandler = require('feathers-errors/handler');
var auth = require('../lib/index');

const settings = {
  user: {
    idField: 'id'
  },
  token: {
    secret: 'super secret'
  }
};

// Initialize the application
var app = feathers()
  .configure(rest())
  .configure(socketio())
  .configure(hooks())
  // Needed for parsing bodies (login)
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  // Configure feathers-authentication
  .configure(auth(settings))
  // Initialize a user service
  .use('/users', memory())
  // A simple Message service that we can used for testing
  .use('/messages', memory({
    paginate: {
      default: 5,
      max: 25
    }
  }))
  .use('/', feathers.static(__dirname + '/public'))
  .use(errorHandler());

var messageService = app.service('/messages');
messageService.create({text: 'A million people walk into a Silicon Valley bar'}, {}, function(){});
messageService.create({text: 'Nobody buys anything'}, {}, function(){});
messageService.create({text: 'Bar declared massive success'}, {}, function(){});

messageService.before({
  all: [
    auth.hooks.isAuthenticated(),
    auth.hooks.hasPermissions('messages')
  ]
});

var userService = app.service('users');

// Add a hook to the user service that automatically replaces
// the password with a hash of the password before saving it.
userService.before({
  create: auth.hooks.hashPassword()
});

// Create a user that we can use to log in
var User = {
  email: 'admin@feathersjs.com',
  password: 'admin',
  permissions: ['*']
};

userService.create(User, {}).then(function(user) {
  console.log('Created default user', user);
});

app.on('login', function(data) {
  console.log('User logged in', data);
});

app.on('logout', function(data) {
  console.log('User logged out', data);
});

app.listen(3030);

console.log('Feathers authentication app started on 127.0.0.1:3030');
