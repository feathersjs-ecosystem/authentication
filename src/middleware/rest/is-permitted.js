import errors from 'feathers-errors';
import Debug from 'debug';

const debug = Debug('feathers-authentication:middleware:is-permitted');

export default function isPermitted(req, res, next) {
  debug('Checking for permitted request');

  if (req.permitted || req.feathers.permitted) {
    return next();
  }

  next(new errors.Forbidden('You do not have the correct permissions.'));
}