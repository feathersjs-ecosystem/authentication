import Debug from 'debug';
import errors from 'feathers-errors';

const THIRTY_SECONDS = 30000;  // in milliseconds
const ONE_DAY = 60*60*24*1000; // in milliseconds
const debug = Debug('feathers-authentication:set-cookie');
const defaults = {
  cookie: {
    name: 'feathers-session',
    // name: 'feathers-jwt',
    httpOnly: true
  }
};

// TODO (EK): Support session cookies for server side rendering

export default function setCookie(options = {}) {
  debug('Setting up setCookie middleware with options:', options);

  if (options.cookie === undefined) {
    throw new Error(`'cookie' must be provided to setCookie() middleware or set to 'false'`);
  }

  return function(req, res, next) {
    // NOTE (EK): If we are not dealing with a browser or it was an
    // XHR request then just skip this. This is primarily for
    // handling the oauth redirects and for us to securely send the
    // JWT to the client in a cookie.
    if (req.xhr || req.is('json') || !req.accepts('html')) {
      return next();
    }

    // If cookies are enabled set our JWT in a cookie.
    if (options.cookie) {
      // clear any previous JWT cookie
      res.clearCookie(options.cookie.name);

      // Check HTTPS and cookie status in production.
      if (!req.secure && process.env.NODE_ENV === 'production' && options.cookie.secure) {
        console.warn('WARN: Request isn\'t served through HTTPS: JWT in the cookie is exposed.');
        console.info('If you are behind a proxy (e.g. NGINX) you can:');
        console.info('- trust it: http://expressjs.com/en/guide/behind-proxies.html');
        console.info('- set cookie.secure false');
      }

      let cookieOptions = Object.assign({}, options.cookie);

      // If a custom expiry wasn't passed then set the expiration to be 30 seconds from now.
      if (cookieOptions.expires === undefined) {
        const expiry = new Date(Date.now() + THIRTY_SECONDS);
        cookieOptions.expires = expiry;
      }

      if ( !(cookieOptions.expires instanceof Date) ) {
        throw new Error('cookie.expires must be a valid Date object');
      }

      res.cookie(options.cookie.name, res.data.token, cookieOptions);
    }

    // Redirect to our success route
    res.redirect(options.successRedirect);
  };
}