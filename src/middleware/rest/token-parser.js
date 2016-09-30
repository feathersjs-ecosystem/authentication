// Make sure than an auth token passed in is available for hooks
// and services. This gracefully falls back from
// header -> cookie (optional) -> body -> query string

import merge from 'lodash.merge';
import Debug from 'debug';

const debug = Debug('feathers-authentication:middleware:token-parser');

export default function tokenParser(options = {}) {
  debug('Registering tokenParser middleware');

  return function(req, res, next) {
    const app = req.app;
    const authOptions = app.get('auth');

    options = merge({ token: {}, cookie: {} }, authOptions, options);

    debug('Running tokenParser middleware with options:', options);

    const header = options.header;
    const tokenName = options.token.name;

    if (!header) {
      return next(new Error(`'header' must be provided to tokenParser() middleware or set 'auth.header' in your config.`));
    }

    if (!tokenName) {
      return next(new Error(`'token.name' must be provided to tokenParser() middleware or set 'auth.token.name' in your config.`));
    }

    debug('Parsing token');

    // Normalize header capitalization the same way Node.js does
    let token = req.headers[header.toLowerCase()];

    // Check the header for the token (preferred method)
    if (token) {
      // if the value contains "bearer" or "Bearer" then cut that part out
      if ( /bearer/i.test(token) ) {
        token = token.split(' ')[1];
      }

      debug('Token found in header');
    }
    
    // Check the cookie if we are haven't found a token already
    // and cookies are enabled.
    if (!token && options.cookie.enabled && req.cookies) {
      const cookieName = options.cookie.name;

      if (!cookieName) {
        return next(new Error(`'cookie.name' must be provided to tokenParser() middleware or set 'auth.cookie.name' in your config.`));
      }

      const cookie = req.cookies[cookieName];

      if (cookie) {
        debug(`Token found in cookie '${cookieName}'`);
        token = cookie;
      }
    }
    // Check the body next if we still don't have a token
    else if (req.body[tokenName]) {
      debug('Token found in req.body');
      token = req.body[tokenName];
      delete req.body[tokenName];
    }
    // Finally, check the query string. (worst method but nice for quick local dev)
    else if (req.query[tokenName] && app.env !== 'production') {
      debug('Token found in req.query');
      token = req.query[tokenName];
      delete req.query[tokenName];

      console.warn(`You are passing your token in the query string. This NOT secure and is NOT recommended.`);
      console.warn(`Instead you should pass it as an Authorization header using HTTPS in production. See docs.feathersjs.com for more details.`);
    }

    // Tack it on to our express and feathers request object
    // so that it is passed to hooks and services.
    req.feathers[tokenName] = token;
    req[tokenName] = token;

    next();
  };
}