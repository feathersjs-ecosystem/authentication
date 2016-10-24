import Debug from 'debug';

// Exposed modules
import hooks from './hooks';
import express from './middleware/express';
import { socketioHandler, primusHandler } from './middleware/socket';
import getOptions from './options';
import Authentication from './base';
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

    if (!options.header) {
      throw new Error(`'header' property must be set in authentication options`);
    }

    // Make sure cookies don't have to be sent over HTTPS
    // when in development or test mode.
    if (app.env === 'development' || app.env === 'test') {
      options.cookie.secure = false;
    }

    debug('Setting up Authentication class and Express middleware');

    app.authentication = new Authentication(app, options);
    app.authenticate = app.authentication.authenticate.bind(app.authenticate);
    app.use(express.getJWT(options));
    app.configure(service(options));

    app.setup = function() {
      let result = _super.apply(this, arguments);

      // Socket.io middleware
      if (app.io) {
        debug('registering Socket.io authentication middleware');
        app.io.on('connection', socketioHandler(app, options));
      }

      // Primus middleware
      if (app.primus) {
        debug('registering Primus authentication middleware');
        app.primus.on('connection', primusHandler(app, options));
      }

      return result;
    };
  };
}

// Exposed Modules
Object.assign(init, {
  hooks,
  express,
  service,
  Authentication,
  sockets: {
    socketioHandler, primusHandler
  }
});
