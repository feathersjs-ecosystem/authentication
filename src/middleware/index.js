import errors from 'feathers-errors';
import jwt from 'jsonwebtoken';

// Usually this is a big no no but passport requires the 
// request object to inspect req.body and req.query so we
// need to miss behave a bit. Don't do this in your own code!
export let exposeRequestObject = function(req, res, next) {
  req.feathers.req = req;
  next();
}

// Make the authenticated passport user also available for services
export let exposeAuthenticatedUser = function(options = {}) {
  // if (!options.provider) {
  //   throw new Error('You must pass a provider. This could be "rest", "socketio", or "primus".');
  // }

  return function(req, res, next) {
    req.feathers.user = req.user;
    next();
  };
}

export let setupSocketAuthentication = function(options = {}) {
  let middleware;
  let app = options.app;

  if (!options.secret) {
    throw new Error('You must provide a token secret');
  }

  if (!options.provider) {
    throw new Error('You must pass a socket provider. This could be "socketio", or "primus".');
  }

  switch(options.provider.toLowerCase()) {
    case 'socketio':
      middleware = function(socket, next) {
        socket.feathers.req = socket.request;

        console.log('running socket.io middleware');

        // NOTE (EK): This middleware runs more than once. Setting up this listener
        // multiple times is probably no good.
        socket.on('authenticate', function(data) {
          console.log('authenticating', data);
          
          // Authenticate the user using token strategy
          if (data.token) {
            // jwt.verify(data.token, options.secret, function(error, data) {
            //   if (error) {
            //     return next(error);
            //   }
              
            //   delete data.password;

            //   socket.feathers.user = data;
            //   socket.emit('authenticated', data);

            //   next(null, data);
            // });
            app.service('/auth/token').find(data, {}).then(function(data){
              delete data.password;

              socket.feathers.user = data;
              socket.emit('authenticated', data);

              next(null, data);
            }).catch(next);
          }
          // Authenticate the user using local auth strategy
          else {
            app.service('auth/local').create(data, {}).then(function(data) {
              delete data.password;

              socket.feathers.user = data;
              socket.emit('authenticated', data);

              next(null, data);
            }).catch(next);
          }
        });
      };
      break;
    case 'primus':
      middleware = function(req, done) {
        verifyToken(req.handshake.query.token, options.secret, req, done);
      };
      break;
  }

  return middleware;
};