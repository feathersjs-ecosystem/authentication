import Debug from 'debug';

const debug = Debug('feathers-authentication:middleware:login-success');

export default function loginSuccess(options = {}) {
  debug('Registering loginSuccess middleware');

  return function(req, res, next) {
    if (options.successRedirect !== undefined) {    
      debug(`Redirecting to ${options.successRedirect} after succesful authentication.`);
      return res.redirect(options.successRedirect);
    }
    
    next();
  };
}