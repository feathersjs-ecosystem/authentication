import Debug from 'debug';
import errors from 'feathers-errors';
import omit from 'lodash.omit';
import { normalizeError } from 'feathers-socket-commons/lib/utils';

const debug = Debug('feathers-authentication:sockets:handler');

function handleSocketCallback(promise, callback) {
  if (typeof callback === 'function') {
    promise.then(data => callback(null, data))
      .catch(error => {
        debug(`Socket authentication error`, error);
        callback(normalizeError(error));
      });
  }

  return promise;
}

export default function setupSocketHandler(app, options, { feathersParams, provider, emit, disconnect }) {
  const service = app.service(options.service);

  return function(socket) {
    const authenticate = function (data, callback = () => {}) {
      const { strategy } = data;
      const body = omit(data, 'strategy');

      socket._feathers = {
        query: {},
        params: {},
        body,
        headers: {},
        session: {},
        cookies: {}
      };

      if (!strategy) {
        const error = new Error(`An authentication 'strategy' must be provided.`);
        return callback(normalizeError(error));
      }

      if (!app.passport._strategy(strategy)) {
        const error = new Error(`Your '${strategy}' authentication strategy is not registered with passport.`);
        return callback(normalizeError(error));
      }

      const promise = app.authenticate(strategy, options[strategy])(socket._feathers)
        .then(result => {
          if (result.success) {
            // NOTE (EK): I don't think we need to support
            // custom redirects or even can.
            // if (options.successRedirect) {
            //   return {
            //     redirect: true,
            //     status: 302,
            //     url: options.successRedirect
            //   };
            // }
            return Promise.resolve(result);
          }

          if (result.fail) {
            // NOTE (EK): I don't think we need to support
            // custom redirects or even can.
            // if (options.failureRedirect) {
            //   return {
            //     redirect: true,
            //     status: 302,
            //     url: options.failureRedirect
            //   };
            // }

            // TODO (EK): Reject with something...
            // You get back result.challenge and result.status
            const { challenge, status = 401 } = result;
            const message = options.failureMessage || (challenge && challenge.message);
            
            return Promise.reject(new errors[status](message, challenge));
          }

          // NOTE (EK): I don't think we need to support
          // redirects or even can. These are in place for
          // OAuth and you can't do typical OAuth over sockets.
          // if (result.redirect) {
          //   return { result };
          // }
          
          // NOTE (EK): This handles redirects and .pass()
          return Promise.reject(new errors.NotAuthenticated('Authentication could not complete. You might be using an unsupported socket authentication strategy. Refer to docs.feathersjs.com for more details.'));
        })
        .then(result => {
          return app.service('authentication').create(result, { provider }).then(tokens => {
            // Add the response and tokens to the socket connection so that
            // they can be referenced in the future. (ie. attach the user)
            // TODO (EK): Get the passport 'assignProperty' and service for the
            // entity so that we can keep it up to date.
            let connection = feathersParams(socket);

            // TODO (EK): make header pull from config.
            const headers = {
              authorization: `JWT ${tokens.accessToken}`
            };

            connection = Object.assign(connection, result, tokens, { headers, authenticated: true });
            // Might not need this one
            socket._feathers.headers = headers;

            app.emit('login', result, {
              provider,
              socket,
              connection
            });

            return Promise.resolve(tokens);
          });
        });

      handleSocketCallback(promise, callback);
    };

    const logout = function (callback = () => {}) {
      const connection = feathersParams(socket);
      const { accessToken } = connection;

      if (accessToken) {
        debug('Logging out socket with accessToken', accessToken);

        delete connection.accessToken;
        delete connection.authenticated;
        connection.headers = {};
        socket._feathers.body = {};
        socket._feathers.headers = {};

        const promise = service.remove(accessToken, { provider }).then(result => {
          debug(`Successfully logged out socket with accessToken`, accessToken);

          app.emit('logout', result, {
            provider,
            socket,
            connection
          });

          return result;
        });

        handleSocketCallback(promise, callback);
      }
    };

    socket.on('authenticate', authenticate);
    socket.on(disconnect, logout);
    socket.on('logout', logout);
  };
}
