import errors from 'feathers-errors';
import jwt from 'jsonwebtoken';

const FIVE_SECONDS = 5000;

// Usually this is a big no no but passport requires the 
// request object to inspect req.body and req.query so we
// need to miss behave a bit. Don't do this in your own code!
export let exposeRequestObject = function(req, res, next) {
  req.feathers.req = req;
  next();
}

// Make the authenticated passport user also available for services
export let exposeAuthenticatedUser = function(options = {}) {
  return function(req, res, next) {
    req.feathers.user = req.user;
    next();
  };
}

export let setupSocketIOAuthentication = function(app, options = {}) {
  return function(socket, next) {

    // Set a timeout for the socket to establish a secure connection within.
    const authTimeout = setTimeout(() => { socket.disconnect('unauthorized') }, options.timeout || FIVE_SECONDS);

    let errorHandler = function(error) {
      socket.emit('error', error, function(){
        socket.disconnect('unauthorized');
      });

      throw error;
    };
    
    // TODO (EK): Do the name space dance as described in this article
    // https://facundoolano.wordpress.com/2014/10/11/better-authentication-for-socket-io-no-query-strings/

    // Expose the request object to services and hooks
    // for Passport. This is normally a big no no.
    socket.feathers.req = socket.request;

    // NOTE (EK): This middleware runs more than once. Setting up this listener
    // multiple times is probably no good.
    socket.on('authenticate', function(data) {
      // Clear our timeout because we are authenticating
      clearTimeout(authTimeout);

      // Authenticate the user using token strategy
      if (data.token) {
        if (typeof data.token !== 'string') {
          return errorHandler(new errors.BadRequest('Invalid token data type.'));
        }

        let params = {
          query: {
            token: data.token
          }
        };

        app.service('/auth/token').find(params).then(data => {
          socket.feathers.user = data;
          socket.emit('authenticated', data);
        }).catch(errorHandler);
      }
      // Authenticate the user using local auth strategy
      else {
        // Put our data in a fake req.body object to get local auth
        // with Passport to work because it checks res.body for the 
        // username and password.
        let params = {
          req: socket.request
        };

        params.req.body = data;

        app.service('auth/local').create(data, params).then(data => {
          socket.feathers.user = data;
          socket.emit('authenticated', data);
        }).catch(errorHandler);
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