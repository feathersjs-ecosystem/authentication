import Debug from 'debug';

const debug = Debug('feathers-authentication:middleware:success-redirect');

export default function successRedirect(options = {}) {
  debug('Registering successRedirect middleware to', options.successRedirect);

  return function(req, res, next) {
    if (options.successRedirect) {
      debug(`Redirecting to ${options.successRedirect} after succesful authentication.`);

      return res.redirect(options.successRedirect);
    }

    next();
  };
}
