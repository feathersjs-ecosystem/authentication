import errors from 'feathers-errors';
import Debug from 'debug';

const debug = Debug('feathers-authentication:populate-user');
const defaults = {
  endpoint: 'users',
  idField: '_id'
};

export default function populateUser(options = {}) {
  debug('Registering populateUser middleware with options:', options);

  return function(req, res, next) {
    debug('Attempting to populate user');
    const app = req.app;

    options = Object.assign({}, defaults, app.get('auth').user, options);

    const id = (req.payload && req.payload[options.idField]) ? req.payload[options.idField] : undefined;
    const userService = options.service || app.service(options.endpoint);
    
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
    .catch(next);
  }
};