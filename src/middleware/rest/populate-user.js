import merge from 'lodash.merge';
import Debug from 'debug';

const debug = Debug('feathers-authentication:middleware:populate-user');

// TODO (EK): Make generic to support any entity

export default function populateUser(options = {}) {
  debug('Registering populateUser middleware');

  return function(req, res, next) {
    const app = req.app;
    const authOptions = app.get('auth') || {};

    options = merge({ user: {}, cookie: {} }, authOptions, options);
    debug('Running populateUser middleware with options:', options);
    debug('Attempting to populate user');

    if (!options.user.service) {
      return next(new Error(`'user.service' must be provided to populateUser() middleware or set 'auth.user.service' in your config.`));
    }

    if (!options.user.idField) {
      return next(new Error(`'user.idField' must be provided to populateUser() middleware or set 'auth.user.idField' in your config.`));
    }

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

        if (options.cookie.enabled) {
          const cookieName = options.cookie.name;

          if (!cookieName) {
            return next(new Error(`'cookie.name' must be provided to populateUser() middleware or set 'auth.cookie.name' in your config.`));
          }

          debug(`Clearing '${cookieName}' cookie`);
          res.clearCookie(cookieName);
        }
        
        return next();
      }

      next(error);
    });
  };
}