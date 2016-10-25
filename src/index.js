import Debug from 'debug';

// Exposed modules
import hooks from './hooks';
import express from './middleware/express';
import socketHandlers from './middleware/socket';
import getOptions from './options';
import Authentication from './base';
import service from './service';

const debug = Debug('feathers-authentication:index');

export default function init(config = {}) {
  return function authentication() {
    const app = this;
    // Merge and flatten options
    const options = getOptions(config);

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
    app.configure(socketHandlers(options));
  };
}

// Exposed Modules
Object.assign(init, {
  hooks,
  express,
  service,
  Authentication,
  socketHandlers
});
