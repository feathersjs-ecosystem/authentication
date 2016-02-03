import passport from 'passport';
import hooks from './hooks';
import token from './services/token';
import local from './services/local';
import twitter from './services/twitter';
import github from './services/github';
import facebook from './services/facebook';
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

    if (options.facebook) {
      app.configure(facebook(options.facebook));
    }

    // Make the Passport user available for REST services.
    if (app.rest) {
      console.log('registering REST authentication middleware');
      app.use( middleware.exposeAuthenticatedUser() );
    }


    app.setup = function() {
      let result = _super.apply(this, arguments);

      // Socket.io middleware
      if (app.io) {
        console.log('registering Socket.io authentication middleware');
        app.io.on('connection', middleware.setupSocketIOAuthentication(app));
      }

      // Primus middleware
      if (app.primus) {
        console.log('registering Primus authentication middleware');
        app.primus.on('connection', middleware.setupPrimusAuthentication(app));
      }

      return result;
    };
  };
}

export { hooks };
