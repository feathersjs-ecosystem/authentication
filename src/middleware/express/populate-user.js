import omit from 'lodash.omit';
import Debug from 'debug';

const debug = Debug('feathers-authentication:populate-user');
const defaults = {
  user: {
    endpoint: 'users',
    idField: '_id'
  },
  cookies: {
    'feathers-session': true,
    'feathers-jwt': true
  }
};

export default function populateUser(options = {}) {
  options = Object.assign({}, defaults, options);

  debug('Registering populateUser middleware with options:', options);

  return function(req, res, next) {
    debug('Attempting to populate user');
    const app = req.app;

    if (app.locals) {
      delete app.locals.user;
    }

    options = Object.assign({}, defaults, app.get('auth'), options);

    const hasID = req.payload && req.payload[options.user.idField] !== undefined;
    const id = hasID ? req.payload[options.user.idField] : undefined;
    const userService = options.service || app.service(options.user.endpoint);

    // If we don't have an id to look up a
    // user by then move along.
    if (id === undefined) {
      return next();
    }

    debug(`Populating user ${id}`);

    userService.get(id).then(result => {
      const user = result.toJSON ? result.toJSON() : result;

      req.user = user;
      req.feathers.user = user;

      if (app.locals) {
        app.locals.user = user;
      }

      next();
    })
    .catch(error => {
      // If the user that is associated with the token doesn't
      // exist anymore then we should make sure to clear cookies.
      if (error.code === 404) {
        debug(`User with id '${id}' not found. Clearing cookies.`);

        const cookies = omit(options.cookies, 'enable');

        for (let key of Object.keys(cookies)) {
          const cookie = cookies[key];
          
          // If the cookie is not disabled clear it    
          if (cookie) {
            debug(`Clearing '${key}' cookie`);
            res.clearCookie(key);
          }
        }
        
        return next();
      }

      next(error);
    });
  };
}