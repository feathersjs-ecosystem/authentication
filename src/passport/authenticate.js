/*
 * An authentication function that is called by
 * app.authenticate. Inspired by
 * https://github.com/jaredhanson/passport/blob/master/lib/middleware/authenticate.js
 */
import makeDebug from 'debug';

const debug = makeDebug('feathers-authentication:passport:authenticate');

export default function authenticate (options = {}) {
  const app = this;

  debug('Initializing custom passport authenticate', options);

  // TODO (EK): Need the current socket or request

  // This function is bound by passport and called by passport.authenticate()
  return function (passport, name, strategyOptions = {}, callback = () => {}) {

    debug('Inside passport.authenticate', passport, name, strategyOptions, callback);
    
    // This is called by the feathers middleware or hook
    return function (req = {}) {
      return new Promise((resolve, reject) => {
        // TODO (EK): Support transformAuthInfo
        
        // Allow you to set a location for the success payload.
        // Default is hook.params.user, req.user and socket.user.
        const assignProperty = options.assignProperty || strategyOptions.assignProperty || 'user';

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
          throw new Error(`Unknown authentication strategy '${layer}'`);
        }
        

        // Implement required passport methods that
        // can be called by a passport strategy.
        let strategy = Object.create(prototype);

        strategy.redirect = (url, status = 302) => {
          // TODO (EK): Handle redirect
          // redirect to a given url
          // res.redirect(status, url);
          console.log('Redirecting', url, status);
          resolve({ redirect: true, url, status });
        };

        strategy.fail = (challenge, status) => {
          // TODO (EK): Handle fail
          console.error('Authentication Failed', challenge, status);
          resolve({
            fail: true,
            challenge,
            status
          });
        };
        
        strategy.error = error => {
          // TODO (EK): Do we need to wrap up as a Feathers error?
          console.error('AUTH ERROR', error);
          reject(error);
        };

        strategy.success = info => {
          // TODO (EK): Handle success
          console.log('Success!', info);
          resolve({
            success: true,
            data: { [assignProperty]: info }
          });
        };

        strategy.pass = () => resolve();

        console.log('REQUEST', req);
        // NOTE (EK): Passport expects an express/connect
        // like request object. So we need to create on.
        let request = req;
        request.body = request.body || request.data;
        request.headers = request.headers || request.params.headers;
        request.session = request.session || {};
        request.cookies = request.cookies || request.params.cookies;

        console.log('REQUEST2', request);

        strategy.authenticate(request, strategyOptions);
      });
    };
  };
}