import passport from 'passport';
import hooks from './hooks';
import token from './services/token';
import local from './services/local';
import twitter from './services/twitter';
import * as middleware from './middleware';

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

    // Make the Passport user available for REST services.
    if (app.rest) {
      console.log('registering REST authentication middleware');
      app.use( middleware.exposeAuthenticatedUser({ provider: 'rest'}) );
    }


    app.setup = function() {
      var result = oldSetup.apply(this, arguments);
      let io = this.io;
      let primus = this.primus;

      // Socket.io middleware
      if (io) {
        console.log('registering SocketIO authentication middleware');

        io.use( middleware.setupSocketIOAuthentication(app) );
        // app.service('/auth/token').on('created', function(data) {
        //   socket.feathers.token = data;
        // });
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
