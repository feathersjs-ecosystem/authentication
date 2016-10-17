import Debug from 'debug';

// Exposed modules
// import hooks from './hooks';
// import token from './services/token';
// import local from './services/local';
// import oauth2 from './services/oauth2';
// import * as mw from './middleware';
import getOptions from './options';
import Authentication from './authentication';
import service from './service';

const debug = Debug('feathers-authentication:index');

export default function init(config = {}) {
  return function authentication() {
    const app = this;
    const _super = app.setup;
    // Merge and flatten options
    const options = getOptions(config);

    // NOTE (EK): Currently we require token based auth so
    // if the developer didn't provide a config for our token
    // provider then we'll set up a sane default for them.
    if (!options.secret) {
      throw new Error (`You must provide a 'secret' in your authentication configuration`);
    }

    // Make sure cookies don't have to be sent over HTTPS
    // when in development or test mode.
    if (app.env === 'development' || app.env === 'test') {
      options.cookie.secure = false;
    }

    app.authentication = new Authentication(app, options);
    app.configure(service(options));

    // REST middleware
    if (app.rest && options.setupMiddleware) {
      debug('registering REST authentication middleware');

      // // Be able to parse cookies it they are enabled
      // if (authOptions.cookie.enable) {
      //   app.use(mw.cookieParser());
      // }

      // // Expose Express req & res objects to hooks and services
      // app.use(mw.exposeRequestResponse(authOptions));
      // // Parse token from header, cookie, or request objects
      // app.use(mw.tokenParser(authOptions));
      // // Verify and decode a JWT if it is present
      // app.use(mw.verifyToken(authOptions));
      // // Make the Passport user available for REST services.
      // app.use(mw.populateUser(authOptions));
      // // Register server side logout middleware
      // app.use(mw.logout(authOptions));
    } else if (app.rest) {
      debug('Not registering REST authentication middleware. Did you disable it on purpose?');
    }

    app.setup = function() {
      let result = _super.apply(this, arguments);

    //   // Socket.io middleware
    //   if (app.io && authOptions.setupMiddleware) {
    //     debug('registering Socket.io authentication middleware');
    //     app.io.on('connection', mw.setupSocketIOAuthentication(app, authOptions));
    //   }
    //   else if (app.primus) {
    //     debug('Not registering Socket.io authentication middleware. Did you disable it on purpose?');
    //   }

    //   // Primus middleware
    //   if (app.primus && authOptions.setupMiddleware) {
    //     debug('registering Primus authentication middleware');
    //     app.primus.on('connection', mw.setupPrimusAuthentication(app, authOptions));
    //   }
    //   else if (app.primus) {
    //     debug('Not registering Primus authentication middleware. Did you disable it on purpose?');
    //   }

      return result;
    };
  };
}

// Exposed Modules
// init.hooks = hooks;
// init.middleware = mw;
// init.LocalService = local;
// init.TokenService = token;
// init.OAuth2Service = oauth2;
