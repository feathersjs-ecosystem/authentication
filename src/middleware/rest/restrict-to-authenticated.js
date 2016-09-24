import errors from 'feathers-errors';
import Debug from 'debug';

const debug = Debug('feathers-authentication:middleware:restrict-to-authenticated');

export default function restrictToAuthenticated(req, res, next) {
  debug('Checking for authenticated user');

  if (req.authenticated) {
    return next();
  }

  next(new errors.NotAuthenticated());
}