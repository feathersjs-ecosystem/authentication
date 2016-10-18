import Debug from 'debug';
import errors from 'feathers-errors';

const debug = Debug('feathers-authentication:middleware:socket');

function setupSocketHandler(app, options, {
  feathersParams, provider, emit, disconnect
}) {

  const service = app.service(options.service);

  if(!service) {
    throw new Error(`Could not find authentication service '${options.service}'`);
  }

  return function(socket) {
    const authenticate = (data, callback = () => {}) => {
      service.create(data, { provider })
        .then( ({ token, authenticated }) => {

          if(!authenticated){
            throw new errors.NotAuthenticated('You are not authenticated.');
          }

          debug(`Successfully authenticated socket with token`, token);

          feathersParams(socket).token = token;

          return { token, authenticated };
        })
        .then(data => callback(null, data))
        .catch(error => {
          debug(`Socket authentication error`, error);
          callback(error);
        });
    };
    const logout = (callback = () => {}) => {
      const params = feathersParams(socket);
      const { token } = params;

      if(token) {
        debug('Authenticated socket disconnected', token);

        delete params.token;

        service.remove(token)
          .then(data => callback(null, data))
          .catch(error => {
            debug(`Error logging out socket`, error);
            callback(error);
          });
      }
    };

    socket.on('authenticate', authenticate);
    socket.on(disconnect, logout);
    socket.on('logout', logout);
  };
}

export function socketio(app, options = {}) {
  debug('Setting up Socket.io authentication middleware with options:', options);

  const providerSettings = {
    feathersParams(socket) {
      return socket.feathers;
    },
    provider: 'socketio',
    emit: 'emit',
    disconnect: 'disconnect'
  };

  return setupSocketHandler(app, options, providerSettings);
}

export function primus(app, options = {}) {
  debug('Setting up Primus authentication middleware with options:', options);

  const providerSettings = {
    feathersParams(socket) {
      return socket.request.feathers;
    },
    provider: 'primus',
    emit: 'send',
    disconnect: 'disconnection'
  };

  return setupSocketHandler(app, options, providerSettings);
}
