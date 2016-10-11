import Debug from 'debug';
import jwt from 'jsonwebtoken';

const debug = Debug('feathers-authentication');

export default class Authentication {
  constructor(app, options) {
    this.options = options;
    this.app = app;
    this._middleware = [];
  }

  use(... middleware) {
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

    return promise;
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

    if(data.iss) {
      delete settings.issuer;
    }

    if(data.sub) {
      delete settings.subject;
    }

    if(data.exp) {
      delete settings.expiresIn;
    }

    return new Promise((resolve, reject) => {
      debug('Creating JWT using options', settings);

      jwt.sign(data, secret, settings, (error, token) => {
        if (error) {
          debug('Error signing JWT', error);
          return reject(error);
        }

        debug('New JWT issued with payload', data);
        return resolve({ token, payload: data });
      });
    });
  }
}
