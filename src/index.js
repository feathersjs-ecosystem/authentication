import Debug from 'debug';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import merge from 'lodash.merge';

// Exposed modules
import h from './hooks';
import token from './services/token';
import local from './services/local';
import oauth2 from './services/oauth2';
import * as mw from './middleware';

const debug = Debug('feathers-authentication:main');

const THIRTY_SECONDS = 30000;  // in milliseconds
const ONE_DAY = 60*60*24*1000; // in milliseconds

// Options that apply to any provider
const defaults = {
  header: 'Authorization',
  setupMiddleware: true, // optional - to setup middleware yourself set to false.
  cookies: {
    enable: false, // Set to true to enable all cookies
    // Used for redirects where JS can pick up the JWT and
    // store it in localStorage (ie. redirect or OAuth)
    'feathers-jwt': { // set to false to disable this cookie
      httpOnly: false,
      maxAge: THIRTY_SECONDS,
      secure: process.env.NODE_ENV === 'production'
    },
    // Used for server side rendering
    'feathers-session': { // set to false to disable this cookie
      httpOnly: true,
      maxAge: ONE_DAY,
      secure: process.env.NODE_ENV === 'production'
    }
  },
  token: {
    name: 'token', // optional
    endpoint: '/auth/token', // optional
    issuer: 'feathers', // optional
    algorithm: 'HS256', // optional
    expiresIn: '1d', // optional
    secret: null, // required
    successRedirect: null, // optional - no default. If set the default success handler will redirect to location
    failureRedirect: null, // optional - no default. If set the default success handler will redirect to location
    successHandler: null, // optional - a middleware to handle things once authentication succeeds
  },
  local: {
    endpoint: '/auth/local', // optional
    successRedirect: null, // optional - no default. If set the default success handler will redirect to location
    failureRedirect: null, // optional - no default. If set the default success handler will redirect to location
    successHandler: null, // optional - a middleware to handle things once authentication succeeds
  },
  user: {
    endpoint: '/users', // optional
    idField: '_id', // optional
    usernameField: 'email', // optional
    passwordField: 'password', // optional
    service: null // optional - no default. an actual service (can be client side service)
  }
};

export default function auth(config = {}) {
  return function() {
    const app = this;
    let _super = app.setup;

    // If cookies are enabled then load our defaults and
    // any passed in options
    if (config.cookies && config.cookies.enable) {
      config.cookies = Object.assign({}, defaults.cookies, config.cookies);
    }

    // Merge and flatten options
    const authOptions = merge(defaults, app.get('auth'), config);

    // NOTE (EK): Currently we require token based auth so
    // if the developer didn't provide a config for our token
    // provider then we'll set up a sane default for them.
    if (!authOptions.token.secret) {
      throw new Error (`You must provide a token secret in your config via 'auth.token.secret'.`);
    }

    // Set the options on the app
    app.set('auth', authOptions);

    // REST middleware
    if (app.rest && authOptions.setupMiddleware) {
      debug('registering REST authentication middleware');
      
      // Be able to parse cookies it that is enabled
      if (authOptions.cookies.enable) {
        app.use(cookieParser());
      }

      // Expose Express req & res objects to hooks and services
      app.use(mw.exposeRequestResponse(authOptions));
      // Parse token from header, cookie, or request objects
      app.use(mw.tokenParser(authOptions));
      // Verify and decode a JWT if it is present 
      app.use(mw.decodeToken(authOptions));
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
