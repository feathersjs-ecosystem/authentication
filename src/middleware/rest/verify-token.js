import jwt from 'jsonwebtoken';
import Debug from 'debug';
import merge from 'lodash.merge';

const debug = Debug('feathers-authentication:middleware:verify-token');

module.exports = function verifyToken(options = {}) {
  debug('Registering verifyToken middleware');

  return function(req, res, next) {
    const authOptions = req.app.get('auth') || {};

    // Grab the token options here
    options = merge({}, authOptions.token, options);
    debug('Running verifyToken middleware with options:', options);

    const token = req.token || req.feathers.token;

    // If no token present then move along
    if (!token) {
      return next();
    }

    debug('Verifying token');

    const secret = options.secret;

    if (!secret) {
      next(new Error(`A 'secret' must be provided to the verifyToken() middleware or set 'auth.token.secret' in your config.`));
    }

    // Convert the algorithm value to an array because that's
    // what jsonwebtoken expects.
    if (options.algorithm) {
      options.algorithms = [options.algorithm];
      delete options.algorithm;
    }

    jwt.verify(token, secret, options, function(error, payload) {
      // Attach our decoded token payload to the request objects and
      // expose to feathers hooks and services via hook.params.payload.
      if (!error) {
        req.authenticated = true;
        req.feathers.authenticated = true;

        if (payload) {
          req.payload = payload;
          req.feathers.payload = payload;
        }
      }

      // If the token errors then we won't have a payload so we can
      // just proceed. The actual verification should be done by
      // the isAuthenticated middleware or hook.
      next();
    });
  };
};