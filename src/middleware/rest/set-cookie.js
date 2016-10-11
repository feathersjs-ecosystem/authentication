import Debug from 'debug';
import ms from 'ms';

const debug = Debug('feathers-authentication:middleware:set-cookie');

export default function setCookie(options = {}) {
  debug('Registering setCookie middleware');

  return function(req, res, next) {
    const app = req.app;
    const authOptions = app.get('auth') || {};

    options = Object.assign({}, authOptions.cookie, options);
    debug('Running setCookie middleware with options:', options);

    // NOTE (EK): If we are not dealing with a browser or it was an
    // XHR request then just skip this. This is primarily for
    // handling the oauth redirects and for us to securely send the
    // JWT to the client in a cookie.
    // if (req.xhr || req.is('json') || !req.accepts('html')) {
    //   return next();
    // }

    // If cookies are enabled then set it with it's options.
    if (options.enabled) {
      debug(`Attempting to set cookies`);

      const cookie = options.name;

      if (cookie) {
        debug(`Clearing old '${cookie}' cookie`);
        res.clearCookie(cookie);

        // Check HTTPS and cookie status in production.
        if (!req.secure && app.env === 'production' && options.secure) {
          console.warn('WARN: Request isn\'t served through HTTPS: JWT in the cookie is exposed.');
          console.info('If you are behind a proxy (e.g. NGINX) you can:');
          console.info('- trust it: http://expressjs.com/en/guide/behind-proxies.html');
          console.info(`- set cookie['${cookie}'].secure false`);
        }

        // If a custom expiry wasn't passed then set the expiration
        // to be the default maxAge of the respective cookie otherwise it
        // will just become a session cookie.
        if (options.expires === undefined && options.maxAge) {
          options.expires = makeExpiry(options.maxAge);
        }

        // By default, the cookie will expire with the token.
        if(options.expires === undefined && options.maxAge === undefined){
          options.expires = makeExpiry(options.token.expiresIn);
        }

        if ( options.expires && !(options.expires instanceof Date) ) {
          throw new Error('cookie.expires must be a valid Date object');
        }
        
        // remove some of our options that don't apply to express cookie creation
        // as well as the maxAge because we have set an explicit expiry.
        delete options.name;
        delete options.enabled;
        delete options.maxAge;

        debug(`Setting '${cookie}' cookie`);
        res.cookie(cookie, res.data.token, options);
      }
    }

    next();
  };
}