import Debug from 'debug';
import errors from 'feathers-errors';

const debug = Debug('feathers-authentication:middleware');
const THIRTY_SECONDS = 30000;

// Usually this is a big no no but passport requires the
// request object to inspect req.body and req.query so we
// need to miss behave a bit. Don't do this in your own code!
export let exposeConnectMiddleware = function(req, res, next) {
  req.feathers.req = req;
  req.feathers.res = res;
  next();
};

// Make the authenticated passport user also available for REST services.
// We might need this for when we have session supported auth.
// export let exposeAuthenticatedUser = function(options = {}) {
//   return function(req, res, next) {
//     req.feathers.user = req.user;
//     next();
//   };
// };

// Make sure than an auth token passed in is available for hooks
// and services. This gracefully falls back from
// header -> body -> query string
export let normalizeAuthToken = function(options = {}) {
  debug('Setting up normalizeAuthToken middleware with options:', options);

  if (!options.header) {
    throw new Error(`'header' must be provided to normalizeAuthToken() middleware`);
  }

  return function(req, res, next) {
    let token = req.headers[options.header];

    // Check the header for the token (preferred method)
    if (token) {
      // if the value contains "bearer" or "Bearer" then cut that part out
      if ( /bearer/i.test(token) ) {
        token = token.split(' ')[1];
      }
    }

    // Check the body next if we still don't have a token
    if (req.body.token) {
      token = req.body.token;
      delete req.body.token;
    }
    // Finally, check the query string. (worst method but nice for quick local dev)
    else if (req.query.token) {
      token = req.query.token;
      delete req.query.token;
    }

    // Tack it on to our feathers object so that it is passed to services
    req.feathers.token = token;

    next();
  };
};

export let successfulLogin = function(options = {}) {
  debug('Setting up successfulLogin middleware with options:', options);

  if (options.cookie === undefined) {
    throw new Error(`'cookie' must be provided to successfulLogin() middleware or set to 'false'`);
  }

  return function(req, res, next) {
    // NOTE (EK): If we are not dealing with a browser or it was an
    // XHR request then just skip this. This is primarily for
    // handling the oauth redirects and for us to securely send the
    // JWT to the client in a cookie.
    if (!options.successRedirect || req.xhr || req.is('json') || !req.accepts('html')) {
      return next();
    }

    // If cookies are enabled set our JWT in a cookie.
    if (options.cookie) {
      // clear any previous JWT cookie
      res.clearCookie(options.cookie.name);

      // Only send back cookies when not in production or when in production and using HTTPS
      if (!req.secure && process.env.NODE_ENV === 'production') {
        console.error(`You should be using HTTPS in production! Refusing to send JWT in a cookie`);
      }
      else {
        const cookieOptions = Object.assign({}, options.cookie, { path: options.successRedirect });

        // If a custom expiry wasn't passed then set the expiration to be 30 seconds from now.
        if (cookieOptions.expires === undefined) {
          const expiry = new Date();
          expiry.setTime(expiry.getTime() + THIRTY_SECONDS);
          cookieOptions.expires = expiry;
        }

        if ( !(cookieOptions.expires instanceof Date) ) {
          throw new Error('cookie.expires must be a valid Date object');
        }

        res.cookie(options.cookie.name, res.data.token, cookieOptions);
      }
    }

    // Redirect to our success route
    res.redirect(options.successRedirect);
  };
};

export let failedLogin = function(options = {}) {
  debug('Setting up failedLogin middleware with options:', options);

  if (options.cookie === undefined) {
    throw new Error(`'cookie' must be provided to failedLogin() middleware or set to 'false'`);
  }

  return function(error, req, res, next) {
    // NOTE (EK): If we are not dealing with a browser or it was an
    // XHR request then just skip this. This is primarily for
    // handling redirecting on an oauth failure.
    // console.log('Auth Error', error, options);
    if (!options.failureRedirect || req.xhr || req.is('json') || !req.accepts('html')) {
      return next(error);
    }

    // clear any previous JWT cookie
    if (options.cookie) {
      res.clearCookie(options.cookie.name);
    }

    debug('An authentication error occurred.', error);

    // Redirect to our failure route
    res.redirect(options.failureRedirect);
  };
};

export let setupSocketIOAuthentication = function(app, options = {}) {
  options = Object.assign({}, options);

  debug('Setting up Socket.io authentication middleware with options:', options);

  return function(socket) {
    let errorHandler = function(error) {
      socket.emit('unauthorized', error, function(){
        // TODO (EK): Maybe we support disconnecting the socket
        // if a certain number of authorization attempts have failed
        // for brute force protection
        // socket.disconnect('unauthorized');
      });

      throw error;
    };

    // Expose the request object to services and hooks
    // for Passport. This is normally a big no no.
    socket.feathers.req = socket.request;

    socket.on('authenticate', function(data) {
      // Authenticate the user using token strategy
      if (data.token) {
        if (typeof data.token !== 'string') {
          return errorHandler(new errors.BadRequest('Invalid token data type.'));
        }

        const params = Object.assign({ provider: 'socketio' }, data);

        // The token gets normalized in hook.params for REST so we'll stay with
        // convention and pass it as params using sockets.
        app.service(options.tokenEndpoint).create({}, params).then(response => {
          socket.feathers.token = response.token;
          socket.feathers.user = response.data;
          socket.emit('authenticated', response);
        }).catch(errorHandler);
      }
      // Authenticate the user using local, facebook or google auth strategy
      else {
        // Put our data in a fake req.body object to get local auth
        // with Passport to work because it checks res.body for the
        // username and password.
        let params = {
          provider: 'socketio',
          req: socket.request
        };

        params.req.body = data;

        // localEndpoint is default
        let endPoint = options.localEndpoint;

        if (data.type === 'facebook') {
          endPoint = options.facebookEndpoint;
        } else if (options.type === 'google') {
          endPoint = options.googleEndpoint;
        }

        app.service(endPoint).create(data, params).then(response => {
          socket.feathers.token = response.token;
          socket.feathers.user = response.data;
          socket.emit('authenticated', response);
        }).catch(errorHandler);
      }
    });

    socket.on('logout', function(callback) {

      // TODO (EK): Blacklist token
      try {
        delete socket.feathers.token;
        delete socket.feathers.user;
      }
      catch(error) {
        debug('There was an error logging out', error);
        return callback(new Error('There was an error logging out'));
      }

      callback();
    });
  };
};

// TODO (EK): DRY this up along with the code in setupSocketIOAuthentication
export let setupPrimusAuthentication = function(app, options = {}) {
  options = Object.assign({}, options);

  debug('Setting up Primus authentication middleware with options:', options);

  return function(socket) {
    let errorHandler = function(error) {
      socket.send('unauthorized', error);
      // TODO (EK): Maybe we support disconnecting the socket
      // if a certain number of authorization attempts have failed
      // for brute force protection
      // socket.end('unauthorized', error);
      throw error;
    };

    socket.request.feathers.req = socket.request;

    socket.on('authenticate', function(data) {
      // Authenticate the user using token strategy
      if (data.token) {
        if (typeof data.token !== 'string') {
          return errorHandler(new errors.BadRequest('Invalid token data type.'));
        }

        const params = Object.assign({ provider: 'primus' }, data);

        // The token gets normalized in hook.params for REST so we'll stay with
        // convention and pass it as params using sockets.
        app.service(options.tokenEndpoint).create({}, params).then(response => {
          socket.request.feathers.token = response.token;
          socket.request.feathers.user = response.data;
          socket.send('authenticated', response);
        }).catch(errorHandler);
      }
      // Authenticate the user using local auth strategy
      else {
        // Put our data in a fake req.body object to get local auth
        // with Passport to work because it checks res.body for the
        // username and password.
        let params = {
          provider: 'primus',
          req: socket.request
        };

        params.req.body = data;

        app.service(options.localEndpoint).create(data, params).then(response => {
          socket.request.feathers.token = response.token;
          socket.request.feathers.user = response.data;
          socket.send('authenticated', response);
        }).catch(errorHandler);
      }
    });

    socket.on('logout', function(callback) {

      // TODO (EK): Blacklist token
      try {
        delete socket.request.feathers.token;
        delete socket.request.feathers.user;
      }
      catch(error) {
        debug('There was an error logging out', error);
        return callback(new Error('There was an error logging out'));
      }

      callback();
    });
  };
};

export default {
  exposeConnectMiddleware,
  normalizeAuthToken,
  successfulLogin,
  failedLogin,
  setupSocketIOAuthentication,
  setupPrimusAuthentication
};
