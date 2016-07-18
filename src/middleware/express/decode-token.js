import jwt from 'jsonwebtoken';
import errors from 'feathers-errors';
import Debug from 'debug';

const debug = Debug('feathers-authentication:decode-token');

const defaults = {
  issuer: 'feathers',
  algorithm: 'HS256',
  expiresIn: '1d', // 1 day
};

module.exports = function(options = {}) {
  debug('Setting up decodeToken middleware with options:', options);

  return function(req, res, next) {
    const token = req.feathers.token;

    // If no token present then move along
    if (!token) {
      return next();
    }

    debug('Decoding token');

    const authOptions = req.app.get('auth') || {};

    // Grab the token options here
    options = Object.assign(defaults, authOptions.token, options);

    const secret = options.secret;

    if (!secret) {
      throw new Error(`You need to pass 'options.secret' to the verifyToken() hook or set 'auth.token.secret' it in your config.`);
    }

    // Convert the algorithm value to an array
    if (options.algorithm) {
      options.algorithms = [options.algorithm];
      delete options.algorithm;
    }

    jwt.verify(token, secret, options, function(error, payload) {
      if (error) {
        // Return a 401 if the token has expired or is invalid.
        return next(new errors.NotAuthenticated(error));
      }

      // Attach our decoded token payload to the request objects and
      // expose to feathers hooks and services via hook.params.payload.
      req.payload = payload;
      req.feathers.payload = payload;

      next();
    });
  }
};