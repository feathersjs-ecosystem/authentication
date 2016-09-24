import Debug from 'debug';
import errors from 'feathers-errors';

const debug = Debug('feathers-authentication:middleware:socket');

function setupSocketHandler(feathersParams, provider, emit, disconnect, app, options) {
  return function(socket) {
    let errorHandler = function(error) {
      socket[emit]('unauthorized', error, function(){
        // TODO (EK): Maybe we support disconnecting the socket
        // if a certain number of authorization attempts have failed
        // for brute force protection
        // socket.disconnect('unauthorized');
      });

      throw error;
    };

    // Expose the request object to services and hooks
    // for Passport. This is normally a big no no.
    feathersParams(socket).req = socket.request;

    socket.on('authenticate', function(data) {

      function successHandler(response) {
        feathersParams(socket).token = response.token;
        feathersParams(socket).user = response.user;
        socket[emit]('authenticated', response);
        app[emit]('login', response);
      }

      // Authenticate the user using token strategy
      if (data.token) {
        if (typeof data.token !== 'string') {
          return errorHandler(new errors.BadRequest('Invalid token data type.'));
        }

        const params = Object.assign({ provider }, data);

        // The token gets normalized in hook.params for REST so we'll stay with
        // convention and pass it as params using sockets.
        app.service(options.token.service)
          .create({}, params)
          .then(successHandler)
          .catch(errorHandler);
      }
      // Authenticate the user using local auth strategy
      else {
        // Put our data in a fake req.body object to get local auth
        // with Passport to work because it checks res.body for the
        // username and password.
        let params = { provider, req: socket.request };

        params.req.body = data;

        app.service(options.local.service)
          .create(data, params)
          .then(successHandler)
          .catch(errorHandler);
      }
    });

    socket.on(disconnect, function() {
      debug('Socket disconnected');
      
      const params = feathersParams(socket);
      const { token, user } = params;
      
      app[emit]('logout', { token, user });
      delete params.token;
      delete params.user;
    });

    socket.on('logout', function(callback = () => {}) {
      // TODO (EK): Blacklist token
      // TODO (EK): Maybe we need to delete any cookies.
      // Can we send the request object this socket is tied to?
      debug('Socket log out');
      
      try {
        const params = feathersParams(socket);
        const { token, user } = params;
        
        app[emit]('logout', { token, user });
        delete params.token;
        delete params.user;
      }
      catch(error) {
        debug('There was an error logging out', error);
        return callback(new Error('There was an error logging out'));
      }

      callback();
    });
  };
}

export function setupSocketIOAuthentication(app, options = {}) {
  debug('Setting up Socket.io authentication middleware with options:', options);

  return setupSocketHandler(
    socket => socket.feathers, 'socketio', 'emit', 'disconnect', app, options
  );
}

export function setupPrimusAuthentication(app, options = {}) {
  debug('Setting up Primus authentication middleware with options:', options);

  return setupSocketHandler(
    socket => socket.request.feathers, 'primus', 'send', 'disconnection', app, options
  );
}
