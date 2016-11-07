/*
 * An authentication function that is called by
 * app.authenticate. Inspired by
 * https://github.com/jaredhanson/passport/blob/master/lib/middleware/authenticate.js
 */
import makeDebug from 'debug';

const debug = makeDebug('feathers-authentication:passport:authenticate');

export default function authenticate (options = {}) {
  const app = this;
  options.assignProperty = options.assignProperty || 'user';

  debug('Initializing custom passport authenticate', options);

  // This function is bound by passport and called by passport.authenticate()
  return function (passport, name, strategyOptions = {}, callback = () => {}) {

    debug('Inside passport.authenticate', passport, name, strategyOptions, callback);
    
    // This is called by the feathers middleware, hook or socket. The req object
    // is a mock request derived from an http request, socket object, or hook.
    return function (req = {}) {
      return new Promise((resolve, reject) => {
        // TODO (EK): Support transformAuthInfo
        
        // Allow you to set a location for the success payload.
        // Default is hook.params.user, req.user and socket.user.
        const assignProperty = strategyOptions.assignProperty || options.assignProperty;

        // TODO (EK): Handle chaining multiple strategies
        // let multi = true;
        // Cast `name` to an array, allowing authentication to pass through a chain of
        // strategies.  The first name to succeed, redirect, or error will halt
        // the chain.  Authentication failures will proceed through each strategy in
        // series, ultimately failing if all strategies fail.
        //
        // This is typically used on API endpoints to allow clients to authenticate
        // using their preferred choice of Basic, Digest, token-based schemes, etc.
        // It is not feasible to construct a chain of multiple strategies that involve
        // redirection (for example both Facebook and Twitter), since the first one to
        // redirect will halt the chain.
        // if (!Array.isArray(name)) {
        //   name = [ name ];
        //   multi = false;
        // }
        const layer = name;

        // let layer = name[i];
        // // If no more strategies exist in the chain, authentication has failed.
        // if (!layer) {
        //   return allFailed();
        // }
        
        // Get the strategy, which will be used as prototype from which to create
        // a new instance.  Action functions will then be bound to the strategy
        // within the context of the HTTP request/response pair.
        let prototype = passport._strategy(layer);

        if (!prototype) {
          return reject(new Error(`Unknown authentication strategy '${layer}'`));
        }
        

        // Implement required passport methods that
        // can be called by a passport strategy.
        let strategy = Object.create(prototype);

        strategy.redirect = (url, status = 302) => {
          debug(`'${layer}' authentication redirecting to`, url, status);
          resolve({ redirect: true, url, status });
        };

        strategy.fail = (challenge, status) => {
          debug(`Authentication strategy '${layer}' failed`, challenge, status);
          resolve({
            fail: true,
            challenge,
            status
          });
        };
        
        strategy.error = error => {
          debug(`Error in '${layer}' authentication strategy`, error);
          reject(error);
        };

        strategy.success = (data, info) => {
          debug(`'${layer}' authentication strategy succeeded`, info);
          resolve({
            success: true,
            data: {
              [assignProperty]: data,
              info
            }
          });
        };

        strategy.pass = () => {
          debug(`Passing on '${layer}' authentication strategy`);
          resolve();
        };

        // NOTE (EK): Passport expects an express/connect
        // like request object. So we need to create on.
        let request = req;
        request.body = request.body || request.data;
        request.headers = request.headers || request.params.headers;
        request.session = request.session || {};
        request.cookies = request.cookies || request.params.cookies;

        strategy.authenticate(request, strategyOptions);
      });
    };
  };
}