import jwt from 'jsonwebtoken';
import Debug from 'debug';

const debug = Debug('feathers-authentication:middleware:decode-token');

module.exports = function decodeToken(options = {}) {
  debug('Registering decodeToken middleware');

  return function(req, res, next) {
    const authOptions = req.app.get('auth') || {};

    // Grab the token options here
    options = Object.assign({}, authOptions.token, options);
    debug('Running decodeToken middleware with options:', options);

    const token = req.feathers.token;

    // If no token present then move along
    if (!token) {
      return next();
    }

    debug('Decoding token');

    const secret = options.secret;

    if (!secret) {
      throw new Error(`You need to pass 'options.secret' to the decodeToken() middleware or set 'auth.token.secret' it in your config.`);
    }

    // Convert the algorithm value to an array because that's
    // what jsonwebtoken expects.
    if (options.algorithm) {
      options.algorithms = [options.algorithm];
      delete options.algorithm;
    }

    jwt.verify(token, secret, options, function(error, payload) {
      if (error) {
        // If the token errors then we won't have a payload so we can
        // just proceed. The actual verification should be done by
        // the restrictToAuthenticated middleware or hook.
        return next();
      }

      // Attach our decoded token payload to the request objects and
      // expose to feathers hooks and services via hook.params.payload.
      req.payload = payload;
      req.feathers.payload = payload;

      next();
    });
  };
};