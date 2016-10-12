import Debug from 'debug';
import errors from 'feathers-errors';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { Strategy } from 'passport-local';
import { successRedirect, setCookie } from '../middleware';
import merge from 'lodash.merge';

const debug = Debug('feathers-authentication:services:local');

export class LocalService {
  constructor(options = {}) {
    this.options = options;
  }

  comparePassword(user, password) {
    const field = this.options.user.passwordField;
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
    const usernameField = this.options.user.usernameField;
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

    // Validate username and password, then generate a JWT and return it
    return new Promise((resolve, reject) => {
      let middleware = passport.authenticate('local', { session: options.local.session }, (error, user) => {
        if (error) {
          return reject(error);
        }

        // Login failed.
        if (!user) {
          return reject(new errors.NotAuthenticated('Invalid login.'));
        }

        debug('User authenticated via local authentication');

        const tokenPayload = {
          [options.user.idField]: user[options.user.idField]
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

    const tokenService = this.options.token.service;
    const userService = this.options.user.service;

    this._tokenService = typeof tokenService === 'string' ? app.service(tokenService) : tokenService;
    this._userService = typeof userService === 'string' ? app.service(userService) : userService;
    
    const passportOptions = {
      usernameField: this.options.user.usernameField,
      passwordField: this.options.user.passwordField,
      passReqToCallback: this.options.local.passReqToCallback
    };

    // Register our local auth strategy and get it to use the passport callback function
    debug('registering passport-local strategy');
    passport.use(new Strategy(passportOptions, this.verify.bind(this)));

    // prevent regular service events from being dispatched
    if (typeof this.filter === 'function') {
      this.filter(() => false);
    }
  }
}

export default function init(options){
  return function() {
    const app = this;
    options = merge({ user: {}, local: {} }, app.get('auth'), options);

    if (options.token === undefined) {
      throw new Error('The TokenService needs to be configured before the Local auth service.');
    }
    
    const Service = options.local.Service || LocalService;
    const successHandler = options.local.successHandler || successRedirect;

    // TODO (EK): Add error checking for required fields
    // - token.service
    // - local.service
    // - user.service
    // - user.idField
    // - user.passwordField
    // - user.usernameField
    // 

    debug('configuring local authentication service with options', options);

    // TODO (EK): Only enable set cookie middleware if cookies are enabled.
    // Initialize our service with any options it requires
    app.use(options.local.service, new Service(options), setCookie(options), successHandler(options));
  };
}

init.Service = LocalService;