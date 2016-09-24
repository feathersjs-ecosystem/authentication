import Debug from 'debug';
import errors from 'feathers-errors';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { Strategy } from 'passport-local';
import { successfulLogin, setCookie } from '../middleware';
import merge from 'lodash.merge';

const debug = Debug('feathers-authentication:services:local');
const defaults = {
  service: '/auth/local',
  tokenService: '/auth/local',
  userService: '/users',
  idField: '_id',
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true,
  session: false,
  // successHandler: null //optional - a middleware to call when successfully authenticated
};

export class Service {
  constructor(options = {}) {
    this.options = options;
  }

  comparePassword(user, password) {
    const field = this.options.passwordField;
    const hash = user[field];

    if (!hash) {
      return Promise.reject(new Error(`User record in the database is missing a '${field}'`));
    }

    debug('Verifying password');
    
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, hash, function(error, result) {
        // Handle 500 server error.
        if (error) {
          return reject(error);
        }

        if (!result) {
          return reject(false);
        }

        debug('Password correct');
        return resolve(user);
      });
    });
  }

  getFirstUser(users) {
    // Paginated services return the array of results in the data attribute.
    let user = users[0] || users.data && users.data[0];

    // Handle bad username.
    if (!user) {
      return Promise.reject(false);
    }

    debug('User found');
    return Promise.resolve(user);
  }

  verify(req, username, password, done) {
    debug('Checking credentials');
    const usernameField = this.options.usernameField;
    const query = { [usernameField]: username };

    // Look up the user
    this._userService.find({ query })
      .then(this.getFirstUser)
      .then(user => this.comparePassword(user, password))
      .then(user => done(null, user))
      .catch(error => error ? done(error) : done(null, error));
  }

  // POST /auth/local
  create(data, params) {
    const options = this.options;
    // let app = this.app;

    // Validate username and password, then generate a JWT and return it
    return new Promise((resolve, reject) => {
      let middleware = passport.authenticate('local', { session: options.session }, (error, user) => {
        if (error) {
          return reject(error);
        }

        // Login failed.
        if (!user) {
          return reject(new errors.NotAuthenticated('Invalid login.'));
        }

        debug('User authenticated via local authentication');

        const tokenPayload = {
          [options.idField]: user[options.idField]
        };

        // Get a new JWT and the associated user from the Auth token service and send it back to the client.
        return this._tokenService
          .create(tokenPayload, { user })
          .then(resolve)
          .catch(reject);
      });

      middleware(params.req);
    });
  }

  setup(app) {
    // attach the app object to the service context
    // so that we can call other services
    this.app = app;

    const tokenService = this.options.tokenService;
    const userService = this.options.userService;

    this._tokenService = typeof tokenService === 'string' ? app.service(tokenService) : tokenService;
    this._userService = typeof userService === 'string' ? app.service(userService) : userService;

    // Register our local auth strategy and get it to use the passport callback function
    debug('registering passport-local strategy');
    passport.use(new Strategy(this.options, this.verify.bind(this)));

    // prevent regular service events from being dispatched
    if (typeof this.filter === 'function') {
      this.filter(() => false);
    }
  }
}

export default function init(options){
  return function() {
    const app = this;
    const authConfig = Object.assign({}, app.get('auth'), options);

    if (authConfig.token === undefined) {
      throw new Error('The TokenService needs to be configured before the Local auth service.');
    }
    
    const LocalService = authConfig.local.Service || Service;
    const userService = authConfig.user.service;
    const tokenService = authConfig.token.service;

    const {
      idField,
      passwordField,
      usernameField
    } = authConfig.user;

    options = merge(defaults, authConfig.local, options, { idField, passwordField, usernameField, userService, tokenService });

    const successHandler = options.successHandler || successfulLogin;

    debug('configuring local authentication service with options', options);

    // TODO (EK): Only enable set cookie middleware if cookies are enabled.
    // Initialize our service with any options it requires
    app.use(options.service, new LocalService(options), setCookie(authConfig), successHandler(options));
  };
}

init.Service = Service;