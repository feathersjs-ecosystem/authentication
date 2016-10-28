import Debug from 'debug';

// Exposed modules
import hooks from './hooks';
import express from './express';
import passport from 'passport';
import adapter from './passport';
import { socketioHandler, primusHandler } from './socket';
import getOptions from './options';
import service from './service';

const debug = Debug('feathers-authentication:index');

export default function init(config = {}) {
  return function authentication() {
    const app = this;
    const _super = app.setup;
    // Merge and flatten options
    const options = getOptions(config);

    if (!options.secret) {
      throw new Error (`You must provide a 'secret' in your authentication configuration`);
    }

    // Make sure cookies don't have to be sent over HTTPS
    // when in development or test mode.
    if (app.env === 'development' || app.env === 'test') {
      options.cookie.secure = false;
    }

    app.set('auth', options);

    debug('Setting up Passport');    
    // Set up our framework adapter
    passport.framework(adapter.call(app, options));
    // Expose passport on the app object
    app.passport = passport;
    // Alias to passport for less keystrokes
    app.authenticate = passport.authenticate.bind(passport);


    // app.use(express.getJWT(options));    
    app.use(express.exposeHeaders());

    if (options.cookie.enabled) {
      debug('Setting up Express exposeCookie middleware');
      app.use(express.exposeCookies());
    }

    app.configure(service(options));
    app.passport.initialize();
  };
}

// Exposed Modules
Object.assign(init, {
  hooks,
  express,
  service,
  // Authentication,
  socket: {
    socketioHandler, primusHandler
  }
});
