import Debug from 'debug';
import errors from 'feathers-errors';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { Strategy } from 'passport-local';
import { successfulLogin, setCookie } from '../middleware';
import merge from 'lodash.merge';

const debug = Debug('feathers-authentication:local');
const defaults = {
  endpoint: '/auth/local',
  tokenEndpoint: '/auth/local',
  userEndpoint: '/users',
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

  buildCredentials(req, username) {
    const usernameField = this.options.usernameField;
    return new Promise(function(resolve) {
      const params = {
        query: {
          [usernameField]: username
        }
      };
      resolve(params);
    });
  }

  checkCredentials(req, username, password, done) {
    debug('Checking credentials');

    this.app.service(this.options.endpoint).buildCredentials(req, username, password)
      // Look up the user
      .then(params => this.app.service(this.options.userEndpoint).find(params))
      .then(users => {
        // Paginated services return the array of results in the data attribute.
        let user = users[0] || users.data && users.data[0];

        // Handle bad username.
        if (!user) {
          return done(null, false);
        }

        debug('User found');
        return user;
      })
      .then(user => {
        const crypto = this.options.bcrypt || bcrypt;
        // Check password
        const hash = user[this.options.passwordField];

        if (!hash) {
          return done(new Error(`User record in the database is missing a '${this.options.passwordField}'`));
        }

        debug('Verifying password');

        crypto.compare(password, hash, function(error, result) {
          // Handle 500 server error.
          if (error) {
            return done(error);
          }

          debug('Password correct');
          return done(null, result ? user : false);
        });
      })
      .catch(done);
  }

  // POST /auth/local
  create(data, params) {
    const options = this.options;
    let app = this.app;

    // Validate username and password, then generate a JWT and return it
    return new Promise(function(resolve, reject){
      let middleware = passport.authenticate('local', { session: options.session }, function(error, user) {
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
        return app.service(options.tokenEndpoint)
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

    // Register our local auth strategy and get it to use the passport callback function
    debug('registering passport-local strategy');
    passport.use(new Strategy(this.options, this.checkCredentials.bind(this)));

    // prevent regular service events from being dispatched
    if (typeof this.filter === 'function') {
      this.filter(() => false);
    }
  }
}

export default function(options){
  return function() {
    const app = this;
    const authConfig = Object.assign({}, app.get('auth'), options);
    const userEndpoint = authConfig.user.endpoint;

    if (authConfig.token === undefined) {
      throw new Error('The TokenService needs to be configured before OAuth');
    }

    const tokenEndpoint = authConfig.token.endpoint;
    
    // TODO (EK): Support pulling in a user and token service directly
    // in order to talk to remote services.

    const {
      idField,
      passwordField,
      usernameField
    } = authConfig.user;

    options = merge(defaults, authConfig.local, options, { idField, passwordField, usernameField, userEndpoint, tokenEndpoint });

    const successHandler = options.successHandler || successfulLogin;

    debug('configuring local authentication service with options', options);

    // Initialize our service with any options it requires
    app.use(options.endpoint, new Service(options), setCookie(authConfig), successHandler(options));
  };
}
