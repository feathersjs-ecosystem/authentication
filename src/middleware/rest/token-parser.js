// Make sure than an auth token passed in is available for hooks
// and services. This gracefully falls back from
// header -> cookie (optional) -> body -> query string

import omit from 'lodash.omit';
import Debug from 'debug';

const debug = Debug('feathers-authentication:middleware:token-parser');
const defaults = {
  header: 'Authorization',
  token: {
    name: 'token'
  },
  cookies: {}
};

export default function tokenParser(options = {}) {
  debug('Registering tokenParser middleware');

  options = Object.assign({}, defaults, options);
  const name = options.token.name;

  if (!options.header) {
    throw new Error(`'header' must be provided to tokenParser() middleware`);
  }

  if (!name) {
    throw new Error(`'options.token.name' must be provided to tokenParser() middleware`);
  }

  return function(req, res, next) {
    debug('Running tokenParser middleware with options:', options);
    debug('Parsing token');
    const app = req.app;

    // Normalize header capitalization the same way Node.js does
    let token = req.headers[options.header.toLowerCase()];

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
    if (!token && options.cookies.enable && req.cookies) {
      const cookies = omit(options.cookies, 'enable');
      
      // Loop through our cookies and see if we have an
      // enabled one with a token.
      // 
      // TODO (EK): This will stop at the first one found.
      // This may be a problem.
      for (let key of Object.keys(cookies)) {
        // If cookies are enabled and one of our expected
        // ones was sent then grab the token from it.
        if (cookies[key] && req.cookies[key]) {
          debug(`Token found in cookie '${key}'`);
          token = req.cookies[key];
          break;
        }
      }
    }
    // Check the body next if we still don't have a token
    else if (req.body[name]) {
      debug('Token found in req.body');
      token = req.body[name];
      delete req.body[name];
    }
    // Finally, check the query string. (worst method but nice for quick local dev)
    else if (req.query[name] && app.env !== 'production') {
      debug('Token found in req.query');
      token = req.query[name];
      delete req.query[name];

      console.warn(`You are passing your token in the query string. This not secure and is not recommended.`);
      console.warn(`Instead you should pass it as an Authorization header using HTTPS in production. See docs.feathersjs.com for more details.`);
    }

    // Tack it on to our express and feathers request object
    // so that it is passed to hooks and services.
    req.feathers[name] = token;
    req[name] = token;

    next();
  };
}