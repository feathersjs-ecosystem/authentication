import Debug from 'debug';

const debug = Debug('feathers-authentication:middleware:logout');

export default function logout(options = {}) {
  const cookieOptions = options.cookie || {};

  debug('Registering logout middleware with options:', cookieOptions);

  if(cookieOptions.enabled && !cookieOptions.name) {
    throw new Error(`'cookie.name' must be provided to logout() middleware in authentication options`);
  }

  return function(req, res, next) {
    req.logout = function() {
      debug('Logging out');

      // Remove the token from the auth service
      if(req.token && options.service) {
        const service = req.app.service(options.service);

        service.remove(req.token);
      }

      // Remove the cookie
      if (cookieOptions.enabled) {
        const cookieName = cookieOptions.name;

        debug(`Clearing '${cookieName}' cookie`);
        res.clearCookie(cookieName);
      }
    };

    next();
  };
}
