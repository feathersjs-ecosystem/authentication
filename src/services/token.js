import Debug from 'debug';
import jwt from 'jsonwebtoken';
import merge from 'lodash.merge';
import errors from 'feathers-errors';
import { successRedirect, setCookie } from '../middleware';
import {
  loadAuthenticated,
  // checkPermissions,
  // parseToken,
  // isAuthenticated,
  // isPermitted
} from '../hooks';

const debug = Debug('feathers-authentication:services:token');

/**
 * Verifies that a JWT token is valid. This is a private hook.
 *
 * @param  {Object} options - An options object
 * @param {String} options.secret - The JWT secret
 */
let _verifyToken = function(options = {}){
  const secret = options.token.secret;
  return function(hook) {
    return new Promise(function(resolve, reject){
      // If it was an internal call just skip
      if (!hook.params.provider) {
        hook.params.data = hook.data;
        return resolve(hook);
      }

      debug('Verifying token');

      const token = hook.params.token;

      jwt.verify(token, secret, options.token, function (error, payload) {
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

export class TokenService {
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
  // get(id, params) {
  //   if (id !== 'refresh') {
  //     return Promise.reject(new errors.NotFound());
  //   }

  //   const options = this.options.token;
  //   const data = params;
  //   // Our before hook determined that we had a valid token or that this
  //   // was internally called so let's generate a new token with the user
  //   // id and return both the ID and the token.
  //   return new Promise(function(resolve){
  //     jwt.sign(data, options.secret, options, token => {
  //       return resolve( Object.assign(data, { token }) );
  //     });
  //   });
  // }

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
      noTimestamp
    } = Object.assign({}, this.options.token, params.tokenOptions);

    const secret = this.options.token.secret;
    const options = {
      algorithm,
      notBefore,
      audience,
      jwtid,
      noTimestamp
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

    // Our before hook determined that we had a valid token or that this
    // was internally called so let's generate a new token with the user
    // id and return both the ID and the token.
    return new Promise((resolve, reject) => {
      debug('Creating JWT using options:', options);
      debug('Payload:', data);
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
      // all: [
      //   parseToken(),
      //   isAuthenticated(),
      //   checkPermissions({ namespace: 'users', on: 'user', field: 'permissions' }),
      //   isPermitted()
      // ],
      create: [_verifyToken(options)],
      find: [_verifyToken(options)],
      get: [_verifyToken(options)]
    });


    // TODO (EK): I'm not sure these should be done automatically
    // I think this should be left up to the developer or the
    // generator.
    // TODO (EK): Remove these and make the developer explicitly do
    // this after we have the client check for a user and request if
    // it didn't come in the response to authenticate.
    this.after({
      create: [
        loadAuthenticated()
      ],
      find: [
        loadAuthenticated()
      ],
      get: [
        loadAuthenticated()
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
    options = merge({ token: {}, user: {} }, app.get('auth'), options);
    const successHandler = options.token.successHandler || successRedirect;

    debug('configuring token authentication service with options', options);

    // TODO (EK): Add error checking for required fields
    // - token.service
    // - local.service
    // - user.service
    // - user.idField
    // - user.passwordField
    // - user.usernameField

    // TODO (EK): Only enable set cookie middleware if cookies are enabled.
    // Initialize our service with any options it requires
    app.use(options.token.service, new TokenService(options), setCookie(options), successHandler(options));
  };
}

init.Service = TokenService;