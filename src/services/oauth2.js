import Debug from 'debug';
import errors from 'feathers-errors';
import passport from 'passport';
import { successRedirect, setCookie } from '../middleware';
import merge from 'lodash.merge';

const debug = Debug('feathers-authentication:services:oauth2');

// Provider specific config
const defaults = {
  passReqToCallback: true,
  callbackSuffix: 'callback',
  permissions: {
    state: true,
    session: false
  }
};

export class OAuth2Service {
  constructor(options = {}) {
    this.options = options;
  }

  oauthCallback(req, accessToken, refreshToken, profile, done) {
    let app = this.app;
    const options = this.options;
    const params = {
      query: {
        // facebookId: profile.id
        [`${options.provider}Id`]: profile.id
      }
    };

    // Find or create the user since they could have signed up via facebook.
    app.service(options.userService)
      .find(params)
      .then(users => {
        // Paginated services return the array of results in the data attribute.
        let user = users[0] || users.data && users.data[0];

        // TODO (EK): This is where we should look at req.user and see if we
        // can consolidate profiles. We might want to give the developer a hook
        // so that they can control the consolidation strategy.
        const providerData = Object.assign({}, profile._json, {accessToken});

        let data = Object.assign({
          [`${options.provider}Id`]: profile.id,
          [`${options.provider}`]: providerData
        });

        // If user found update and return them
        if (user) {
          const id = user[options.idField];

          // Merge existing user data with new profile data
          // TODO (EK): If stored profile data has been altered this might
          // just overwrite the whole `<provider>` field when it should do a
          // deep merge.
          data = Object.assign({}, user, data);

          debug(`Updating user: ${id}`);

          return app.service(options.userService).patch(id, data).then(updatedUser => {
            // TODO (EK): Handle paginated services?
            return done(null, updatedUser);
          }).catch(done);
        }

        debug(`Creating new user with ${options.provider}Id: ${profile.id}`);

        // No user found so we need to create one.
        return app.service(options.userService).create(data, {body: req.body}).then(user => {
          debug(`Created new user: ${user[options.idField]}`);
          // TODO (EK): Handle paginated services?
          return done(null, user);
        }).catch(done);
      }).catch(done);
  }

  // GET /auth/facebook
  find(params) {
    // Authenticate via your provider. This will redirect you to authorize the application.
    return passport.authenticate(this.options.provider, this.options.permissions)(params.req, params.res);
  }

  // For GET /auth/facebook/callback
  get(id, params) {
    const options = Object.assign({}, this.options, params);
    let app = this.app;

    // TODO (EK): Make this configurable
    if (id !== options.callbackSuffix) {
      return Promise.reject(new errors.NotFound());
    }

    return new Promise(function(resolve, reject){

      let middleware = passport.authenticate(options.provider, options.permissions, function(error, user) {
        if (error) {
          return reject(error);
        }

        // Login failed.
        if (!user) {
          return reject(new errors.NotAuthenticated(`An error occurred logging in with ${options.provider}`));
        }

        const tokenPayload = {
          [options.idField]: user[options.idField]
        };

        // Get a new JWT and the associated user from the Auth token service and send it back to the client.
        return app.service(options.tokenService)
          .create(tokenPayload, { user })
          .then(resolve)
          .catch(reject);
      });

      middleware(params.req, params.res);
    });
  }

  // POST /auth/facebook /auth/facebook::create
  // This is for mobile token based authentication
  create(data, params) {
    const options = this.options;
    let app = this.app;

    if (!options.tokenStrategy) {
      return Promise.reject(new errors.MethodNotAllowed());
    }

    // Authenticate via facebook, then generate a JWT and return it
    return new Promise(function(resolve, reject){
      let middleware = passport.authenticate(`${options.provider}-token`, options.permissions, function(error, user) {
        if (error) {
          return reject(error);
        }

        // Login failed.
        if (!user) {
          return reject(new errors.NotAuthenticated(`An error occurred logging in with ${options.provider}`));
        }

        const tokenPayload = {
          [options.idField]: user[options.idField]
        };

        // Get a new JWT and the associated user from the Auth token service and send it back to the client.
        return app.service(options.tokenService)
          .create(tokenPayload, { user })
          .then(resolve)
          .catch(reject);
      });

      middleware(params.req, params.res);
    });
  }

  setup(app) {
    // attach the app object to the service context
    // so that we can call other services
    this.app = app;

    // Register our Passport auth strategy and get it to use our passport callback function
    const Strategy = this.options.strategy;
    const TokenStrategy = this.options.tokenStrategy;

    debug(`registering passport-${this.options.provider} OAuth2 strategy`);
    passport.use(new Strategy(this.options, this.oauthCallback.bind(this)));

    if (TokenStrategy) {
      debug(`registering passport-${this.options.provider}-token OAuth2 strategy`);
      passport.use(new TokenStrategy(this.options, this.oauthCallback.bind(this)));
    }

    // prevent regular service events from being dispatched
    if (typeof this.filter === 'function') {
      this.filter(() => false);
    }
  }
}

export default function init (options){
  if (!options.provider) {
    throw new Error('You need to pass a `provider` for your authentication provider');
  }

  if (!options.service) {
    throw new Error(`You need to provide an 'service' for your ${options.provider} provider`);
  }

  if (!options.strategy) {
    throw new Error(`You need to provide a Passport 'strategy' for your ${options.provider} provider`);
  }

  if (!options.clientID) {
    throw new Error(`You need to provide a 'clientID' for your ${options.provider} provider`);
  }

  if (!options.clientSecret) {
    throw new Error(`You need to provide a 'clientSecret' for your ${options.provider} provider`);
  }

  return function() {
    const app = this;
    const authConfig = Object.assign({}, app.get('auth'), options);
    const userService = authConfig.user.service;
    const Service = options.Service || OAuth2Service;

    // TODO (EK): Support pulling in a user and token service directly
    // in order to talk to remote services.

    if (authConfig.token === undefined) {
      throw new Error('The TokenService needs to be configured before the OAuth2 service.');
    }

    const tokenService = authConfig.token.service;

    options = merge(defaults, authConfig[options.provider], options, { userService, tokenService });

    const successHandler = options.successHandler || successRedirect;

    options.permissions.state = options.permissions.state === undefined ? true : options.permissions.state;
    options.permissions.session = options.permissions.session === undefined ? false : options.permissions.session;
    options.callbackURL = options.callbackURL || `${options.service}/${options.callbackSuffix}`;

    debug(`configuring ${options.provider} OAuth2 service with options`, options);

    // TODO (EK): throw warning if cookies are not enabled. They are required for OAuth

    // Initialize our service with any options it requires
    app.use(options.service, new Service(options), setCookie(authConfig), successHandler(options));
  };
}

init.Service = OAuth2Service;
