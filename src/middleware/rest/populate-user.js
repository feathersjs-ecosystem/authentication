import omit from 'lodash.omit';
import Debug from 'debug';

const debug = Debug('feathers-authentication:middleware:populate-user');
const defaults = {
  user: {
    service: 'users',
    idField: '_id'
  },
  cookies: {
    'feathers-session': true,
    'feathers-oauth': true
  }
};

export default function populateUser(options = {}) {
  debug('Registering populateUser middleware');

  return function(req, res, next) {
    const app = req.app;

    options = Object.assign({}, defaults, app.get('auth'), options);
    debug('Running populateUser middleware with options:', options);
    debug('Attempting to populate user');

    if (app.locals) {
      delete app.locals.user;
    }
    
    const field = options.user.idField;
    const hasID = req.payload && req.payload[field] !== undefined;
    const id = hasID ? req.payload[field] : undefined;

    // If we don't have an id to look up a
    // user by then move along.
    if (id === undefined) {
      return next();
    }

    let userService = options.user.service;

    if (typeof options.user.service === 'string') {
      userService = app.service(options.user.service);
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