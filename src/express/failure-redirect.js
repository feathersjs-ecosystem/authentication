import Debug from 'debug';
const debug = Debug('feathers-authentication:middleware:failure-redirect');

export default function failureRedirect(options = {}) {
  debug('Registering failureRedirect middleware');

  return function(error, req, res, next) {
    if (options.cookie && options.cookie.enabled) {
      debug(`Clearing old '${options.cookie.name}' cookie`);
      res.clearCookie(options.cookie.name);
    }

    if (req.hook && req.hook.redirect) {
      const { url, status } = req.hook.redirect;
      debug(`Redirecting to ${url} after failed authentication.`);

      return res.redirect(status || 302, url);
    }

    next(error);
  };
}
