import errors from 'feathers-errors';
import Debug from 'debug';

const debug = Debug('feathers-authentication:middleware:is-authenticated');

export default function isAuthenticated(req, res, next) {
  debug('Checking for authenticated request');

  if (req.authenticated || req.feathers.authenticated) {
    return next();
  }

  next(new errors.NotAuthenticated());
}