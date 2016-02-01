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

export let setupSocketIOAuthentication = function(app) {
  return function(socket, next) {
    socket.feathers.req = socket.request;

    // NOTE (EK): This middleware runs more than once. Setting up this listener
    // multiple times is probably no good.
    socket.on('authenticate', function(data) {
      console.log('authenticating', data);
      
      // Authenticate the user using token strategy
      if (data.token) {
        app.service('/auth/token').find(data, {}).then(data => {
          delete data.password;

          socket.feathers.user = data;
          socket.emit('authenticated', data);
        }).catch(error => {
          socket.emit('error', error);
        });
      }
      // Authenticate the user using local auth strategy
      else {
        let params = {
          req: socket.request
        };

        params.req.body = data;

        app.service('auth/local').create(data, params).then(data => {
          console.log('Local Auth Data', data);
          delete data.password;

          socket.feathers.user = data;
          socket.emit('authenticated', data);
        }).catch(error => {
          socket.emit('error', error);
        });
      }
    });
    
    next();
  };
};

export let setupPrimusAuthentication = function(app) {
  return function(req, done) {
    // socket.feathers.req = req;

    // // NOTE (EK): This middleware runs more than once. Setting up this listener
    // // multiple times is probably no good.
    // socket.on('authenticate', function(data) {
    //   console.log('authenticating', data);
      
    //   // Authenticate the user using token strategy
    //   if (data.token) {
    //     app.service('/auth/token').find(data, {}).then(data => {
    //       delete data.password;

    //       socket.feathers.user = data;
    //       socket.emit('authenticated', data);
    //     }).catch(error => {
    //       socket.emit('error', error);
    //     });
    //   }
    //   // Authenticate the user using local auth strategy
    //   else {
    //     app.service('auth/local').create(data, {}).then(data => {
    //       delete data.password;

    //       socket.feathers.user = data;
    //       socket.emit('authenticated', data);

    //       return next(null, data);
    //     }).catch(error => {
    //       socket.emit('error', error);
    //     });
    //   }
    // });
    
    done();
  };
};