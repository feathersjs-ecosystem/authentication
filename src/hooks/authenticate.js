import errors from 'feathers-errors';
import Debug from 'debug';
const debug = Debug('feathers-authentication:hooks:authenticate');

export default function authenticate (strategy, options = {}) {
  // TODO (EK): Handle chaining multiple strategies

  if (!strategy) {
    throw new Error(`The 'authenticate' hook requires one of your registered passport strategies.`);
  }

  return function (hook) {
    const app = hook.app;

    if (hook.type !== 'before') {
      return Promise.reject(new Error(`The 'authenticate' hook should only be used as a 'before' hook.`));
    }

    if (!hook.app.passport._strategy(strategy)) {
      return Promise.reject(new Error(`Your '${strategy}' authentication strategy is not registered with passport.`));
    }

    return app.authenticate(strategy, options)(hook).then(result => {
      if (result.fail) {
        // TODO (EK): Reject with something...
        // You get back result.challenge and result.status
        if (options.failureRedirect) {
          // hook.result = true
          hook.redirect = {
            status: 302,
            url: options.failureRedirect
          }
        }

        const { challenge, status = 401 } = result;
        const message = options.failureMessage || (challenge && challenge.message);
        
        return Promise.reject(new errors[status](message, challenge));
      }

      if (result.success) {
        hook.params = Object.assign({}, hook.params, result);

        if (options.successRedirect) {
          // TODO (EK): Bypass the service?
          // hook.result = true
          hook.redirect = {
            status: 302,
            url: options.successRedirect
          }
        }
      } else if (result.redirect) {
        // TODO (EK): Bypass the service?
        // hook.result = true
        hook.redirect = {
          status: result.status,
          url: result.url
        }
      }

      return Promise.resolve(hook);
    });
  };
}