const errors = require('@feathersjs/errors');
const Debug = require('debug');
const merge = require('lodash.merge');
const debug = Debug('@feathersjs/authentication:hooks:authenticate');

module.exports = function authenticate (strategies, options = {}) {
  if (!strategies) {
    throw new Error(`The 'authenticate' hook requires one of your registered passport strategies.`);
  }

  return function (hook) {
    const app = hook.app;

    // If called internally or we are already authenticated skip
    if (!hook.params.provider || hook.params.authenticated) {
      return Promise.resolve(hook);
    }

    if (hook.type !== 'before') {
      return Promise.reject(new Error(`The 'authenticate' hook should only be used as a 'before' hook.`));
    }

    hook.data = hook.data || {};

    let { strategy } = hook.data;

    // Handle the case where authenticate hook was registered without a passport strategy specified
    if (!strategies) {
      return Promise.reject(new errors.GeneralError(`You must provide an authentication 'strategy'`));
    }

    if (!Array.isArray(strategies)) {
        strategies = [strategies];
    }

    // NOTE (EK): Passport expects an express/connect
    // like request object. So we need to create one.
    let request = {
      query: hook.data,
      body: hook.data,
      params: hook.params,
      headers: hook.params.headers || {},
      cookies: hook.params.cookies || {},
      session: {}
    };

    console.log("STRATEGIES", strategies);

    return Promise.all(strategies.map((strategy) => {
        console.log("STRATEGY", strategy);
        // The client must send a `strategy` name.
        if (!app.passport._strategy(strategy)) {
          return Promise.reject(new errors.BadRequest(`Authentication strategy '${strategy}' is not registered.`));
        }

        const strategyOptions = merge({}, app.passport.options(strategy), options);

        debug(`Attempting to authenticate using ${strategy} strategy with options`, strategyOptions);

        return app.authenticate(strategy, strategyOptions)(request).then((result = {}) => { // collect the results of every member of the auth chain.  !! TRIGGERS ALL (if any) SIDE EFFECTS !!

            if (result.fail) {
                console.log("FAIL");
              // TODO (EK): Reject with something...
              // You get back result.challenge and result.status
              if (strategyOptions.failureRedirect) {
                // TODO (EK): Bypass the service?
                // hook.result = true
                Object.defineProperty(hook.data, '__redirect', { value: { status: 302, url: strategyOptions.failureRedirect } });
              }

              const { challenge, status = 401 } = result;
              let message = challenge && challenge.message ? challenge.message : challenge;

              if (strategyOptions.failureMessage) {
                message = strategyOptions.failureMessage;
              }

              return Promise.resolve(new errors[status](message, challenge));
            }

            console.log("NOTFAIL", result);

            if (result.success) {
              console.log("SUCCESS");
              hook.params = Object.assign({ authenticated: true }, hook.params, result.data);

              // Add the user to the original request object so it's available in the socket handler
              Object.assign(request.params, hook.params);

              if (strategyOptions.successRedirect) {
                // TODO (EK): Bypass the service?
                // hook.result = true
                Object.defineProperty(hook.data, '__redirect', { value: { status: 302, url: strategyOptions.successRedirect } });
              }
            } else if (result.redirect) {
              console.log("REDIRECT");
              // TODO (EK): Bypass the service?
              // hook.result = true
              Object.defineProperty(hook.data, '__redirect', { value: { status: result.status, url: result.url } });
            }

            return Promise.resolve(hook);
        });
    }))
    .then( (results)=>{
        if (results.length) {
            var winner = results.find((result)=>{
                // console.log("RESULT", typeof result);
                if (result.app) { // Not an error, probably (?) a hook
                    return true;
                }
                return false;
            })

            if (winner) {
                console.log("WINNER", winner);
                return Promise.resolve(winner);
            } else {
                return Promise.reject(results[0]); // They were all (probably) errors, so just return the first one like we used to.
            }
        } else {
            return Promise.reject(new errors.GeneralError('No authentication strategies were available.'));
        }

    })
    };
};
