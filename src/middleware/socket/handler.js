import Debug from 'debug';
// import errors from 'feathers-errors';

const debug = Debug('feathers-authentication:sockets:handler');

export function normalizeError(e) {
  let result = {};

  Object.getOwnPropertyNames(e).forEach(key => result[key] = e[key]);

  if(process.env.NODE_ENV === 'production') {
    delete result.stack;
  }

  delete result.hook;

  return result;
}

export default function setupSocketHandler(app, options, {
  feathersParams, provider, emit, disconnect
}) {

  const service = app.service(options.service);

  if(!service) {
    throw new Error(`Could not find authentication service '${options.service}'`);
  }

  return function(socket) {
    const authenticate = (data, callback = () => {}) => {
      service.create(data, { provider })
        .then( ({ token }) => {
          debug(`Successfully authenticated socket with token`, token);

          feathersParams(socket).token = token;

          return { token };
        })
        .then(data => callback(null, data))
        .catch(error => {
          debug(`Socket authentication error`, error);
          callback(normalizeError(error));
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
