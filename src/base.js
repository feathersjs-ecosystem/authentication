import Debug from 'debug';
import jwt from 'jsonwebtoken';
import middlewares from './middleware/authentication';

const debug = Debug('feathers-authentication:authentication:base');

// A basic Authentication class that allows to create and verify JWTs
// and also run through a token authentication chain
export default class Authentication {
  constructor(app, options) {
    this.options = options;
    this.app = app;
    this._verificationHooks = [];
  }

  // Register hooks for the authentication verification chain
  use(hook) {
    this._verificationHooks = this._verificationHooks.concat(hook.call(this.app, this.options));
    return this;
  }

  // Run the JWT verification chain against data passed in
  // by when calling app.authenticate()
  authenticate(data) {
    let promise = Promise.resolve(data);

    debug('Authenticating', data);

    this._verificationHooks.forEach(hook =>
      promise = promise.then(data => hook.call(this.app, data, this.options))
    );

    promise.catch(error => console.error(error.stack));
    return promise;
  }

  // Returns a { token } object either from a string,
  // an HTTP request object or another object with a `.token` property
  getJWT(data) {
    const { header } = this.options;

    if (typeof data === 'string') {
      return Promise.resolve({ accessToken: data });
    } else if (typeof data === 'object' && data.headers) {
      const req = data;

      debug('Parsing accessToken from request');

      // Normalize header capitalization the same way Node.js does
      let accessToken = req.headers && req.headers[header.toLowerCase()];

      // Check the header for the accessToken (preferred method)
      if (accessToken) {
        // if the value contains "bearer" or "Bearer" then cut that part out
        if (/bearer/i.test(accessToken)) {
          accessToken = accessToken.split(' ')[1];
        }

        debug('accessToken found in header', accessToken);
      }

      return Promise.resolve({ accessToken });
    } else if (typeof data === 'object' && data.accessToken) {
      return Promise.resolve({ accessToken: data.accessToken });
    }

    return Promise.resolve();
  }

  verifyJWT(data, params) {
    const settings = Object.assign({}, this.options.jwt, params);
    const token = typeof data === 'string' ? data : data.token;
    const { secret } = this.options;

    debug('Verifying token', token);

    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, settings, (error, payload) => {
        if(error) {
          debug('Error verifying token', error);
          return reject(error);
        }

        debug('Verified token with payload', payload);
        resolve({ token, payload });
      });
    });
  }

  createJWT(data, params) {
    const settings = Object.assign({}, this.options.jwt, params);
    const { secret } = this.options;

    return new Promise((resolve, reject) => {
      debug('Creating JWT using options', settings);

      jwt.sign(data, secret, settings, (error, token) => {
        if (error) {
          debug('Error signing JWT', error);
          return reject(error);
        }

        debug('New JWT issued with payload', data);
        return resolve({ token });
      });
    });
  }
}
