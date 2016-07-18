// Make sure than an auth token passed in is available for hooks
// and services. This gracefully falls back from
// header -> cookie (optional) -> body -> query string

// TODO (EK): Support cookie options
// TODO (EK): Support different types of tokens
import Debug from 'debug';
import errors from 'feathers-errors';

const debug = Debug('feathers-authentication:token-parser');


const defaults = {
  header: 'Authorization',
  tokenKey: 'token',
  cookie: false
};

export default function tokenParser(options = {}) {
  options = Object.assign({}, defaults, options);

  if (!options.header) {
    throw new Error(`'header' must be provided to tokenParser() middleware`);
  }

  debug('Setting up tokenParser middleware with options:', options);

  return function(req, res, next) {
    // Normalize header capitalization the same way Node.js does
    let token = req.headers[options.header.toLowerCase()];

    // Check the header for the token (preferred method)
    if (token) {
      // if the value contains "bearer" or "Bearer" then cut that part out
      if ( /bearer/i.test(token) ) {
        token = token.split(' ')[1];
      }
    }
    
    // Check the cookie if we are haven't found a token already
    // and we explicitly set the option to check cookies.
    if (!token && options.cookie && req.cookies && req.cookies[options.cookie]) {
      token = req.cookies[options.cookie];
    }
    // Check the body next if we still don't have a token
    else if (req.body[options.tokenKey]) {
      token = req.body[options.tokenKey];
      delete req.body[options.tokenKey];
    }
    // Finally, check the query string. (worst method but nice for quick local dev)
    else if (req.query[options.tokenKey]) {
      token = req.query[options.tokenKey];
      delete req.query[options.tokenKey];

      console.warn(`You are passing your token in the query string. This isn't very secure and is not recommended.`);
      console.warn(`Instead you should pass it as an Authorization header. See docs.feathersjs.com for more details.`);
    }

    // Tack it on to our express and feathers request object
    // so that it is passed to hooks and services.
    req.feathers[options.tokenKey] = token;
    req[options.tokenKey] = token;

    next();
  };
}