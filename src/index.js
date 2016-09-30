import Debug from 'debug';
import passport from 'passport';
import merge from 'lodash.merge';

// Exposed modules
import h from './hooks';
import token from './services/token';
import local from './services/local';
import oauth2 from './services/oauth2';
import * as mw from './middleware';

const debug = Debug('feathers-authentication:main');

// Options that apply to any provider
const defaults = {
  header: 'Authorization',
  setupMiddleware: true, // optional - to setup middleware yourself set to false.
  cookie: { // Used for redirects, server side rendering and OAuth
    enabled: false, // Set to true to enable all cookies
    name: 'feathers-jwt',
    httpOnly: true,
    maxAge: '1d',
    secure: true
  },
  token: {
    name: 'token', // optional
    service: '/auth/token', // optional string or Service
    issuer: 'feathers', // optional
    algorithm: 'HS256', // optional
    expiresIn: '1d', // optional
    secret: null, // required
    successRedirect: null, // optional - no default. If set the default success handler will redirect to location
    failureRedirect: null, // optional - no default. If set the default success handler will redirect to location
    successHandler: null // optional - a middleware to handle things once authentication succeeds
  },
  local: {
    service: '/auth/local', // optional string or Service
    successRedirect: null, // optional - no default. If set the default success handler will redirect to location
    failureRedirect: null, // optional - no default. If set the default success handler will redirect to location
    successHandler: null // optional - a middleware to handle things once authentication succeeds
  },
  user: {
    service: '/users', // optional string or Service
    idField: '_id', // optional
    usernameField: 'email', // optional
    passwordField: 'password' // optional
  },
  // oauth: {
  //   service: '/auth/<provider>', // optional string or Service
  //   idField: '_id', // optional
  //   usernameField: 'email', // optional
  //   passwordField: 'password' // optional
  // }
};

export default function auth(config = {}) {
  return function() {
    const app = this;
    let _super = app.setup;

    // Merge and flatten options
    const authOptions = merge({}, defaults, app.get('auth'), config);

    // NOTE (EK): Currently we require token based auth so
    // if the developer didn't provide a config for our token
    // provider then we'll set up a sane default for them.
    if (!authOptions.token.secret) {
      throw new Error (`You must provide a token secret in your config via 'auth.token.secret'.`);
    }

    // Make sure cookies don't have to be sent over HTTPS
    // when in development or test mode.
    if (app.env === 'development' || app.env === 'test') {
      authOptions.cookie.secure = false;
    }

    // Set the options on the app
    app.set('auth', authOptions);

    // REST middleware
    if (app.rest && authOptions.setupMiddleware) {
      debug('registering REST authentication middleware');
      
      // Be able to parse cookies it they are enabled
      if (authOptions.cookie.enable) {
        app.use(mw.cookieParser());
      }

      // Expose Express req & res objects to hooks and services
      app.use(mw.exposeRequestResponse(authOptions));
      // Parse token from header, cookie, or request objects
      app.use(mw.tokenParser(authOptions));
      // Verify and decode a JWT if it is present 
      app.use(mw.verifyToken(authOptions));
      // Make the Passport user available for REST services.
      app.use(mw.populateUser(authOptions));
      // Register server side logout middleware
      app.use(mw.logout(authOptions));
    }
    else if (app.rest) {
      debug('Not registering REST authentication middleware. Did you disable it on purpose?');
    }

    debug('registering passport middleware');
    app.use(passport.initialize());

    app.setup = function() {
      let result = _super.apply(this, arguments);

      // Socket.io middleware
      if (app.io && authOptions.setupMiddleware) {
        debug('registering Socket.io authentication middleware');
        app.io.on('connection', mw.setupSocketIOAuthentication(app, authOptions));
      }
      else if (app.primus) {
        debug('Not registering Socket.io authentication middleware. Did you disable it on purpose?');
      }

      // Primus middleware
      if (app.primus && authOptions.setupMiddleware) {
        debug('registering Primus authentication middleware');
        app.primus.on('connection', mw.setupPrimusAuthentication(app, authOptions));
      }
      else if (app.primus) {
        debug('Not registering Primus authentication middleware. Did you disable it on purpose?');
      }

      return result;
    };
  };
}

// Exposed Modules
auth.hooks = h;
auth.middleware = mw;
auth.LocalService = local;
auth.TokenService = token;
auth.OAuth2Service = oauth2;
