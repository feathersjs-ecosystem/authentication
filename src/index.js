import passport from 'passport';
import hooks from './hooks';
import token from './services/token';
import local from './services/local';
import twitter from './services/twitter';
import _ from 'lodash';
import jwt from 'jsonwebtoken';

export default function(options = {}) {
  console.log('configuring authentication plugin with options', options);

  return function() {
    const app = this;
    let oldSetup = app.setup;
    
    app.use(passport.initialize());

    if (options.token) {
      app.configure(token(options.token));
    }

    if (options.local) {
      app.configure(local(options.local));
    }

    if (options.twitter) {
      app.configure(twitter(options.twitter));
    }

    // Everything below this should be cleaned up

    // Make the Passport user available for REST services.
    app.use(function(req, res, next) {
      if (req.headers.authorization) {
        var token = req.headers.authorization.split(' ')[1];
        console.log('Got an Authorization token', token);
        // TODO: Move token verification into its own middleware. See line ~44.
        jwt.verify(token, options.token.secret, function(err, data) {
          if (err) {
            // Return a 401 Unauthorized if the token has expired.
            if (err.name === 'TokenExpiredError') {
              return res.status(401).json(err);
            }
            return next(err);
          }
          // A valid token's data is set up on feathers.user.
          req.feathers = _.extend({ user: data }, req.feathers);
          return next();
        });
      } else {
        return next();
      }
    });

    app.setup = function() {
      var result = oldSetup.apply(this, arguments);
      var io = app.io;
      var primus = app.primus;

      console.log('running app.setup');

      function setUserData(socket, data) {
        socket.feathers = _.extend({ user: data }, socket.feathers);
      }

      function checkToken(token, socket, callback) {
        if (!token) {
          return callback(null, true);
        }
        jwt.verify(token, options.token.secret, function(err, data) {
          if (err) {
            return callback(err);
          }
          setUserData(socket, data);
          callback(null, data);
        });
      }

      // Socket.io middleware
      if (io) {
        console.log('intializing SocketIO middleware');
        // app.service('/auth/token').on('created', function(data) {
        //   socket.feathers.token = data;
        // });
        
        io.use(function (socket, next) {
          socket.feathers.req = socket.request;
          
          // If there's a token in place, decode it and set up the feathers.user
          checkToken(socket.handshake.query.token, socket, function(err, data){
            if(err) {
              return next(err);
            }

            // If no token was passed, still allow the websocket. Service hooks can take care of Auth.
            if(data === true) {
              return next(null, true);
            }

            socket.on('authenticate', function (data) {
              checkToken(data.token, socket, function (err, data) {
                delete data.password;
                if (data) {
                  socket.emit('authenticated', data);
                }
              });
            });

            return next(null, data);
          });
        });
      }

      // Primus middleware
      if(primus) {
        console.log('intializing Primus middleware');
        primus.authorize(function(req, done) {
          checkToken(req.handshake.query.token, req, done);
        });
      }

      return result;
    };
  };
}

export { hooks };
