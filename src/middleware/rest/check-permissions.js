import Debug from 'debug';

const debug = Debug('feathers-authentication:middleware:check-permissions');

export default function checkPermissions(options = {}) {
  debug('Registering checkPermissions middleware');

  return function(req, res, next) {
    debug('Running checkPermissions middleware with options:', options);
    
    next();
  };
}