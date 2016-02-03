import errors from 'feathers-errors';
const FIVE_SECONDS = 5000;

// Usually this is a big no no but passport requires the 
// request object to inspect req.body and req.query so we
// need to miss behave a bit. Don't do this in your own code!
export let exposeConnectMiddleware = function(req, res, next) {
  req.feathers.req = req;
  req.feathers.res = res;
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
  return function(socket) {
    // Set a timeout for the socket to establish a secure connection within.
    const authTimeout = setTimeout(() => { socket.disconnect('unauthorized') }, options.timeout || FIVE_SECONDS);

    let errorHandler = function(error) {
      socket.emit('unauthorized', error, function(){
        socket.disconnect('unauthorized');
      });

      throw error;
    };
    
    // TODO (EK): Do the name space dance as described in this article
    // https://facundoolano.wordpress.com/2014/10/11/better-authentication-for-socket-io-no-query-strings/

    // Expose the request object to services and hooks
    // for Passport. This is normally a big no no.
    socket.feathers.req = socket.request;

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
  };
};

// TODO (EK): DRY this up along with the code in setupSocketIOAuthentication
export let setupPrimusAuthentication = function(app, options = {}) {
  return function(socket) {
    // Set a timeout for the socket to establish a secure connection within.
    const authTimeout = setTimeout(() => { socket.end('unauthorized', new errors.NotAuthenticated('Authentication timed out.')) }, options.timeout || FIVE_SECONDS);

    let errorHandler = function(error) {
      socket.emit('unauthorized', error, function(){
        socket.end('unauthorized', error);
      });

      throw error;
    };

    socket.request.feathers.req = socket.request;
    
    // TODO (EK): Do the name space dance as described in this article
    // https://facundoolano.wordpress.com/2014/10/11/better-authentication-for-socket-io-no-query-strings/

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
          socket.request.feathers.user = data;
          socket.send('authenticated', data);
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
          socket.request.feathers.user = data;
          socket.send('authenticated', data);
        }).catch(errorHandler);
      }
    });
  };
};