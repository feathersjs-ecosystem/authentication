import passport from 'passport';
import hooks from './hooks';
import token from './services/token';
import local from './services/local';
import twitter from './services/twitter';
import github from './services/github';
import * as middleware from './middleware';

export default function(options = {}) {
  console.log('configuring authentication plugin with options', options);

  return function() {
    const app = this;
    let _super = app.setup;
    
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

    if (options.github) {
      app.configure(github(options.github));
    }

    // Make the Passport user available for REST services.
    if (app.rest) {
      console.log('registering REST authentication middleware');
      app.use( middleware.exposeAuthenticatedUser() );
    }


    app.setup = function() {
      var result = _super.apply(this, arguments);
      let io = app.io;
      let primus = app.primus;

      // Socket.io middleware
      if (io) {
        console.log('registering SocketIO authentication middleware');
        io.use( middleware.setupSocketIOAuthentication(app) );
      }

      // Primus middleware
      if (primus) {
        console.log('registering Primus authentication middleware');
        primus.authorize( middleware.setupPrimusAuthentication(app) );
      }

      return result;
    };
  };
}

export { hooks };
