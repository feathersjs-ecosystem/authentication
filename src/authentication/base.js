import Debug from 'debug';
import jwt from 'jsonwebtoken';
import middlewares from '../token';

const debug = Debug('feathers-authentication:authentication:base');

export default class Authentication {
  constructor(app, options) {
    this.options = options;
    this.app = app;
    this._middleware = middlewares;
  }

  use(... middleware) {
    if(this._middleware === middlewares) {
      this._middleware = [];
    }

    const mapped = middleware.map(current =>
      current.call(this.app, this.options)
    );

    this._middleware = this._middleware.concat(mapped);

    return this;
  }

  authenticate(data) {
    let promise = Promise.resolve(data);

    debug('Authenticating', data);

    this._middleware.forEach(middleware =>
      promise = promise.then(data =>
        middleware.call(this.app, data, this.options)
      )
    );

    promise.catch(error => console.error(error.stack));
    return promise;
  }

  getJWT(data) {
    const { header } = this.options;

    if(typeof data === 'string') {
      return Promise.resolve({ token: data });
    } else if (typeof data === 'object' && data.headers) {
      const req = data;

      debug('Parsing token from request');

      // Normalize header capitalization the same way Node.js does
      let token = req.headers && req.headers[header.toLowerCase()];

      // Check the header for the token (preferred method)
      if (token) {
        // if the value contains "bearer" or "Bearer" then cut that part out
        if (/bearer/i.test(token)) {
          token = token.split(' ')[1];
        }

        debug('Token found in header', token);
      }

      return Promise.resolve({ token, req });
    } else if(typeof data === 'object' && data.token) {
      return Promise.resolve({ token: data.token });
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
