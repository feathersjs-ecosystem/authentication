var feathers = require('feathers');
var rest = require('feathers-rest');
var socketio = require('feathers-socketio');
var hooks = require('feathers-hooks');
var memory = require('feathers-memory');
var bodyParser = require('body-parser');
var errors = require('feathers-errors');
var errorHandler = require('feathers-errors/handler');
var auth = require('../lib/index');
var LocalStrategy = require('passport-local').Strategy;
var JWTStrategy = require('passport-jwt').Strategy;
var GithubStrategy = require('passport-github').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var session = require('express-session');

const settings = {
  secret: 'super secret',
  user: {
    idField: 'id'
  }
};

// Initialize the application
var app = feathers();

app.configure(rest())
  .configure(socketio())
  .configure(hooks())
  // Needed for parsing bodies (login)
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  // Required for OAuth1 (ie. twitter)
  .use(session({
    secret: 'super secret',
    resave: false,
    saveUnititialized: false,
    cookie: {
      maxAge: 30000, // 30 seconds
      // secure: app.env !== 'development' && app.env !== 'testing'
    }
  }))
  // Configure feathers-authentication
  .configure(auth(settings))
  // Initialize a user service
  .use('/users', memory())
  .use('/', feathers.static(__dirname + '/public'))
  .use(errorHandler());


/******************************
 * JWT
 ******************************/

const jwtHandler = function(req, payload, done) {
  console.log('JWT Auth Callback');
  console.log(req, payload);

  // Return the payload. We could also look up the user
  // or do whatever we want to further verify the JWT.
  done(null, payload);
};

const options = Object.assign({
  secretOrKey: app.get('auth').secret,
  jwtFromRequest: ExtractJwt.fromAuthHeader(),
  passReqToCallback: true
}, app.get('auth').jwt);

app.passport.use(new JWTStrategy(options, jwtHandler));

const githubHandler = function(req, accessToken, refreshToken, profile, done) {
  console.log(req, accessToken, refreshToken, profile);

  // Return the payload. We could also look up the user
  // or do whatever we want to further verify the JWT.
  done(null, profile);
};

/******************************
 * Github
 ******************************/

app.passport.use(new GithubStrategy({
  clientID: '',
  clientSecret: '',
  callbackURL: 'http://localhost:3030/auth/github/callback',
  passReqToCallback: true,
  scope: ['user']
}, githubHandler));

app.get('/auth/github', auth.express.authenticate('github'));
app.get('/auth/github/callback', auth.express.authenticate('github'), function(req, res, next) {
  console.log('Github Callback', req.user);
  app.service('authentication').create({ id: req.user.id }).then(result => {
    res.json(result);
  }).catch(next);
});

const twitterHandler = function(req, token, tokenSecret, profile, done) {
  console.log(req, token, tokenSecret, profile);

  // Return the payload. We could also look up the user
  // or do whatever we want to further verify the JWT.
  done(null, profile);
};

/******************************
 * Twitter
 ******************************/

app.passport.use(new TwitterStrategy({
  consumerKey: '',
  consumerSecret: '',
  callbackURL: 'http://localhost:3030/auth/twitter/callback',

  passReqToCallback: true
}, twitterHandler));

app.get('/auth/twitter', auth.express.authenticate('twitter'));
app.get('/auth/twitter/callback', auth.express.authenticate('twitter'), function(req, res, next) {
  console.log('Twitter Callback', req.user);
  app.service('authentication').create({ id: req.user.id }).then(result => {
    res.json(result);
  }).catch(next);
});

/******************************
 * Username + Password
 ******************************/

// TODO (EK): Move to an abstracted strategy
const localHandler = function(req, username, password, done) {
  console.log('Local Auth Callback');
  console.log(req, username, password);

  const query = {
    email: username
  };

  app.service('users').find({ query }).then(result => {
    // Paginated services return the array of results in the data attribute.
    let user = result[0] || result.data && result.data[0];

    console.log(result, user);

    // Handle bad username.
    if (!user) {
      return done(null, false);
    }

    done(null, user);
  }).catch(error => done(error, false));
};

app.passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true,
  session: false
}, localHandler));

app.get('/login', function(req, res, next) {
  console.log('Login route');

  res.json({ login: true });
});

app.post('/login', auth.express.authenticate('local', { session: false, failureRedirect: '/login', successRedirect: '/' }), function(req, res, next) {
  console.log('Logged in', req.user);

  res.json(req.user);
});


app.service('authentication').before({
  create: [
    // auth.hooks.authenticate('local', { session: false })
    // auth.hooks.createJWT()
  ]
});

// app.service('auth').after({
//   create: [
//     auth.hooks.authenticate('local')
//   ]
// });

var userService = app.service('users');

// Add a hook to the user service that automatically replaces
// the password with a hash of the password before saving it.
userService.before({
  get: [
    auth.hooks.authenticate('jwt', { session: false })
  ],
  create: auth.hooks.hashPassword()
});

// Create a user that we can use to log in
var User = {
  email: 'admin@feathersjs.com',
  password: 'admin',
  permissions: ['*']
};

userService.create(User).then(user => {
  console.log('Created default user', user);
}).catch(console.error);

app.on('login', function(tokens, data) {
  console.log('User logged in', tokens, data);
});

app.on('logout', function(tokens, data) {
  console.log('User logged out', tokens, data);
});

app.listen(3030);

console.log('Feathers authentication app started on 127.0.0.1:3030');
