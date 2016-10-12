import Debug from 'debug';

const debug = Debug('feathers-authentication:middleware:logout');

export default function logout(options = {}) {
  debug('Registering logout middleware');

  return function(req, res, next) {
    const app = req.app;
    const authOptions = app.get('auth') || {};

    options = Object.assign({}, authOptions.cookie, options);

    debug('Running logout middleware with options:', options);

    req.logout = function() {
      debug('Logging out');

      if (options.enabled) {
        const cookieName = options.name;

        if (!cookieName) {
          throw new Error(`'cookie.name' must be provided to logout() middleware or set 'auth.cookie.name' in your config.`);
        }

        debug(`Clearing '${cookieName}' cookie`);
        res.clearCookie(cookieName);
      }

      if (req.app.locals) {
        delete req.app.locals.user;
      }
    };
    
    next();
  };
}