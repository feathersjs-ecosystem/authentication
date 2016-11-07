import errors from 'feathers-errors';
import Debug from 'debug';
const debug = Debug('feathers-authentication:express:authenticate');

export default function authenticate (strategy, options = {}) {
  // TODO (EK): Support arrays of strategies

  if (!strategy) {
    throw new Error(`The 'authenticate' hook requires one of your registered passport strategies.`);
  }

  return function (req, res, next) {
    if (!req.app.passport._strategy(strategy)) {
      return next(new Error(`Your '${strategy}' authentication strategy is not registered with passport.`));
    }
    // TODO (EK): Can we do something in here to get away
    // from express-session for OAuth1?
    // TODO (EK): Handle chaining multiple strategies
    req.app.authenticate(strategy, options)(req).then((result = {}) => {
      // TODO (EK): Support passport failureFlash
      // TODO (EK): Support passport successFlash
      if (result.success) {
        Object.assign(req, result.data);
        Object.assign(req.feathers, result.data);

        if (options.successRedirect) {
          return res.redirect(302, options.successRedirect);
        }

        return next();
      }

      if (result.fail) {        
        if (options.failureRedirect) {
          return res.redirect(302, options.failureRedirect);
        }

        const { challenge, status = 401 } = result;
        let message = challenge && challenge.message ? challenge.message : challenge;

        if (options.failureMessage) {
          message = options.failureMessage;
        }
        
        return Promise.reject(new errors[status](message, challenge));
      }

      if (result.redirect) {
        return res.redirect(result.status, result.url);
      }

      // Only gets here if pass() is called by the strategy
      next();
    }).catch(next);
  };
}