import Debug from 'debug';
import errors from 'feathers-errors';
import { normalizeError } from 'feathers-socket-commons/lib/utils';

const debug = Debug('feathers-authentication:sockets:handler');

function handleSocketCallback(promise, callback) {
  if(typeof callback === 'function') {
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
      const promise = service.create(data, { provider })
        .then(jwt => app.authentication.authenticate(jwt))
        .then(result => {
          if (!result.authenticated) {
            throw new errors.NotAuthenticated('Authentication was not successful');
          }

          const { accessToken, refreshToken } = result;
          const connection = feathersParams(socket);

          debug(`Successfully authenticated socket with accessToken`, accessToken);

          // Add the accessToken to the connection so that it shows up as `params.accessToken`
          connection.accessToken = accessToken;

          app.emit('login', result, {
            provider,
            socket,
            connection
          });

          return { accessToken, refreshToken };
        });

      handleSocketCallback(promise, callback);
    };

    const logout = function (callback = () => {}) {
      const connection = feathersParams(socket);
      const { accessToken } = connection;

      if (accessToken) {
        debug('Logging out socket with accessToken', accessToken);

        delete connection.accessToken;

        const promise = service.remove(accessToken, { provider })
          .then(jwt => app.authentication.authenticate(jwt))
          .then(result => {
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
