import jwt from 'jsonwebtoken';
import Debug from 'debug';

const debug = Debug('feathers-authentication:hooks:parse-token');

export default function parseToken(options = {}){
  return function(hook) {
    if (hook.type !== 'before') {
      return Promise.reject(new Error(`The 'parseToken' hook should only be used as a 'before' hook.`));
    }

    // If it was an internal call then skip this hook
    if (!hook.params.provider) {
      return Promise.resolve(hook);
    }

    const authOptions = hook.app.get('auth') || {};
    options = Object.assign({}, authOptions.token, options);

    debug('Running parseToken hook with options:', options);

    const token = hook.params[options.name];

    if (!token) {
      debug(`hook.params.${options.name} is missing. Skipping parseToken hook.`);
      return Promise.resolve(hook);
    }

    const secret = options.secret;

    if (!secret) {
      return Promise.reject(new Error(`You need to pass 'options.secret' to the parseToken() hook or set 'auth.token.secret' it in your config.`));
    }

    // Convert the algorithm value to an array
    if (options.algorithm) {
      options.algorithms = [options.algorithm];
      delete options.algorithm;
    }

    return new Promise(resolve => {
      jwt.verify(token, secret, options, (error, payload) => {
        if (error) {
          debug('Error verifying JWT', error);
          // Return a 401 if the token has expired or is invalid.
          hook.params.authenticated = false;
        }
        else {
          // Flag hook as authenticated and attach our
          // decoded token payload to the params.
          hook.params.authenticated = true;
          hook.params.payload = payload;
        }

        resolve(hook);
      });
    });
  };
}
