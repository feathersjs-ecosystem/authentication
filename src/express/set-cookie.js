import Debug from 'debug';
import omit from 'lodash.omit';
import ms from 'ms';

const debug = Debug('feathers-authentication:middleware:set-cookie');

export default function setCookie(authOptions = {}) {
  debug('Registering setCookie middleware');

  function makeExpiry(timeframe){
    return new Date(Date.now() + ms(timeframe));
  }

  return function(req, res, next) {
    const app = req.app;
    const options = authOptions.cookie;

    debug('Running setCookie middleware with options:', options);

    // NOTE (EK): If we are not dealing with a browser or it was an
    // XHR request then just skip this. This is primarily for
    // handling the oauth redirects and for us to securely send the
    // JWT to the client in a cookie.
    // if (req.xhr || req.is('json') || !req.accepts('html')) {
    //   return next();
    // }

    // If cookies are enabled then set it with its options.
    if (options.enabled && options.name) {
      const cookie = options.name;

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
      } else if(options.expires === undefined && authOptions.jwt.expiresIn) {
        // By default, the cookie will expire with the token.
        options.expires = makeExpiry(authOptions.jwt.expiresIn);
      }

      if(res.hook.method !== 'remove' && res.data && res.data.token) {
        if ( options.expires && !(options.expires instanceof Date) ) {
          return next(new Error('cookie.expires must be a valid Date object'));
        }

        // remove some of our options that don't apply to express cookie creation
        // as well as the maxAge because we have set an explicit expiry.
        const cookieOptions = omit(options, 'name', 'enabled', 'maxAge');

        debug(`Setting '${cookie}' cookie`);
        res.cookie(cookie, res.data.token, cookieOptions);
      }
    }

    next();
  };
}
