import Debug from 'debug';
import errors from 'feathers-errors';
import omit from 'lodash.omit';

const debug = Debug('feathers-authentication:set-cookie');
const defaults = {
  cookies: {}
};

// TODO (EK): Support session cookies for server side rendering
// need to differentiate between the JavaScript accessible JWT cookie
// and the HTTP only session cookie.

export default function setCookie(options = {}) {
  options = Object.assign({}, defaults, options);

  debug('Registering setCookie middleware with options:', options);

  if (options.cookies === undefined) {
    throw new Error(`'options.cookies' must be provided to setCookie() middleware or explicitly set to 'false'`);
  }

  return function(req, res, next) {
    const app = req.app;

    // NOTE (EK): If we are not dealing with a browser or it was an
    // XHR request then just skip this. This is primarily for
    // handling the oauth redirects and for us to securely send the
    // JWT to the client in a cookie.
    if (req.xhr || req.is('json') || !req.accepts('html')) {
      return next();
    }

    // If cookies are enabled go through each one and if it
    // is enabled then set it with it's options.
    if (options.cookies && options.cookies.enable) {
      debug(`Attempting to set cookies`);

      const cookies = omit(options.cookies, 'enable');
      
      for (let name of Object.keys(cookies)) {
        let cookie = cookies[name];
        
        // If the cookie is not disabled clear it    
        if (cookie) {
          const cookieOptions = Object.assign({}, cookie);
          debug(`Clearing old '${name}' cookie`);

          // clear any previous cookie
          res.clearCookie(name);
          
          // Check HTTPS and cookie status in production.
          if (!req.secure && app.env === 'production' && cookie.secure) {
            console.warn('WARN: Request isn\'t served through HTTPS: JWT in the cookie is exposed.');
            console.info('If you are behind a proxy (e.g. NGINX) you can:');
            console.info('- trust it: http://expressjs.com/en/guide/behind-proxies.html');
            console.info(`- set cookie['${name}'].secure false`);
          }

          // If a custom expiry wasn't passed then set the expiration
          // to be the default maxAge of the respective cookie otherwise it
          // will just become a session cookie.
          if (cookieOptions.expires === undefined && cookieOptions.maxAge) {
            const expiry = new Date(Date.now() + cookieOptions.maxAge);
            cookieOptions.expires = expiry;
          }

          if ( cookieOptions.expires && !(cookieOptions.expires instanceof Date) ) {
            throw new Error('cookie.expires must be a valid Date object');
          }
          
          // remove the maxAge because we have set an explicit expiry
          delete cookieOptions.maxAge;

          debug(`Setting '${name}' cookie`);
          res.cookie(name, res.data.token, cookieOptions);
        }
      }
    }

    next();
  };
}