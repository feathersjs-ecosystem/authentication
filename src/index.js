import Debug from 'debug';

// Exposed modules
import hooks from './hooks';
import express from './express';
import getOptions from './options';
import Authentication from './authentication/base';
import service from './authentication/service';

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

    // Express middleware
    if (app.rest && options.setupMiddleware) {
      debug('registering Express authentication middleware');

      app.use(
        express.authenticate(options),
        express.logout(options)
      );
    } else if (app.rest) {
      debug('Not registering Express authentication middleware. Did you disable it on purpose?');
    }

    app.authentication = new Authentication(app, options);
    app.configure(service(options));

    app.setup = function() {
      let result = _super.apply(this, arguments);

      // // Socket.io middleware
      // if (app.io && authOptions.setupMiddleware) {
      //   debug('registering Socket.io authentication middleware');
      //   app.io.on('connection', mw.setupSocketIOAuthentication(app, authOptions));
      // }
      // else if (app.io) {
      //   debug('Not registering Socket.io authentication middleware. Did you disable it on purpose?');
      // }

      // // Primus middleware
      // if (app.primus && authOptions.setupMiddleware) {
      //   debug('registering Primus authentication middleware');
      //   app.primus.on('connection', mw.setupPrimusAuthentication(app, authOptions));
      // } else if (app.primus) {
      //   debug('Not registering Primus authentication middleware. Did you disable it on purpose?');
      // }

      return result;
    };
  };
}

// Exposed Modules
Object.assign(init, {
  hooks,
  express,
  service,
  Authentication
});
