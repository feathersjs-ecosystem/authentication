import Debug from 'debug';
import jwt from 'jsonwebtoken';
import hooks from '../hooks';
import commonHooks from 'feathers-hooks';
import errors from 'feathers-errors';
import { successfulLogin, setCookie } from '../middleware';
import merge from 'lodash.merge';

const debug = Debug('feathers-authentication:services:token');

// Provider specific config
const defaults = {
  service: '/auth/token',
  idField: '_id',
  passwordField: 'password',
  issuer: 'feathers',
  subject: 'auth',
  algorithm: 'HS256',
  expiresIn: '1d', // 1 day
  payload: []
};

/**
 * Verifies that a JWT token is valid. This is a private hook.
 *
 * @param  {Object} options - An options object
 * @param {String} options.secret - The JWT secret
 */
let _verifyToken = function(options = {}){
  const secret = options.secret;

  return function(hook) {
    return new Promise(function(resolve, reject){
      // If it was an internal call just skip
      if (!hook.params.provider) {
        hook.params.data = hook.data;
        return resolve(hook);
      }

      debug('Verifying token');

      const token = hook.params.token;

      jwt.verify(token, secret, options, function (error, payload) {
        if (error) {
          // Return a 401 if the token has expired.
          return reject(new errors.NotAuthenticated(error));
        }

        // Normalize our params with the token in it.
        hook.data = payload;
        hook.params.data = Object.assign({}, hook.data, payload, { token });
        hook.params.query = Object.assign({}, hook.params.query, { token });
        resolve(hook);
      });
    });
  };
};

export class Service {
  constructor(options = {}) {
    this.options = options;
  }

  // GET /auth/token
  // This is sort of a dummy route that we are using just to verify
  // that our token is correct by running our verifyToken hook. It
  // doesn't refresh our token it just returns our existing one with
  // our user data.
  // find(params) {
  //   if (params.data && params.data.token) {
  //     const token = params.data.token;
  //     delete params.data.token;

  //     return Promise.resolve({
  //       token: token,
  //       data: params.data
  //     });
  //   }

  //   return Promise.reject(new errors.GeneralError('Something weird happened'));
  // }

  // GET /auth/token/refresh
  get(id, params) {
    if (id !== 'refresh') {
      return Promise.reject(new errors.NotFound());
    }

    const options = this.options;
    const data = params;
    // Our before hook determined that we had a valid token or that this
    // was internally called so let's generate a new token with the user
    // id and return both the ID and the token.
    return new Promise(function(resolve){
      jwt.sign(data, options.secret, options, token => {
        return resolve( Object.assign(data, { token }) );
      });
    });
  }

  // POST /auth/token
  create(data, params) {
    const {
      algorithm,
      expiresIn,
      notBefore,
      audience,
      issuer,
      jwtid,
      subject,
      noTimestamp,
      header
    } = Object.assign({}, this.options, params.jwt);
    // const payload = this.options.payload;
    const secret = this.options.secret;
    const options = {
      algorithm,
      notBefore,
      audience,
      jwtid,
      noTimestamp,
      header
    };

    if (!data.iss) {
      options.issuer = issuer;
    }
    if (!data.sub) {
      options.subject = subject;
    }
    if (!data.exp) {
      options.expiresIn = expiresIn;
    }

    // const data = {
    //   [this.options.idField]: payload[this.options.idField]
    // };

    // // Add any additional payload fields
    // if (payload && Array.isArray(payload)) {
    //   payload.forEach(field => data[field] = payload[field]);
    // }

    // Our before hook determined that we had a valid token or that this
    // was internally called so let's generate a new token with the user
    // id and return both the ID and the token.
    return new Promise((resolve, reject) => {
      debug('Creating JWT using options:', options);

      jwt.sign(data, secret, options, (error, token) => {
        if (error) {
          debug('Error signing JWT');
          return reject(error);
        }

        debug('New JWT issued with payload', data);
        return resolve({ token });
      });
    });
  }

  setup() {
    const options = this.options;

    // Set up our before hooks
    this.before({
      create: [_verifyToken(options)],
      find: [_verifyToken(options)],
      get: [_verifyToken(options)]
    });


    // TODO (EK): I'm not sure these should be done automatically
    // I think this should be left up to the developer or the
    // generator.
    this.after({
      create: [
        hooks.populateUser(),
        commonHooks.remove(options.passwordField, () => true)
      ],
      find: [
        hooks.populateUser(),
        commonHooks.remove(options.passwordField, () => true)
      ],
      get: [
        hooks.populateUser(),
        commonHooks.remove(options.passwordField, () => true)
      ]
    });

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
    const { passwordField } = authConfig.user;

    options = merge(defaults, authConfig.token, options, { passwordField });

    const successHandler = options.successHandler || successfulLogin;

    debug('configuring token authentication service with options', options);

    // TODO (EK): Only enable set cookie middleware if cookies are enabled.
    // Initialize our service with any options it requires
    app.use(options.service, new Service(options), setCookie(authConfig), successHandler(options));
  };
}

init.Service = Service;