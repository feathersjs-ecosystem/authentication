import Debug from 'debug';
import errors from 'feathers-errors';
import passport from 'passport';
import { successRedirect, setCookie } from '../middleware';
import merge from 'lodash.merge';
import url from 'url';
import {stripSlashes} from 'feathers-commons';

const debug = Debug('feathers-authentication:services:oauth2');

export class OAuth2Service {
  constructor(options = {}) {
    this.options = options;
  }

  getFirstUser(users) {
    // Paginated services return the array of results in the data attribute.
    let user = users[0] || users.data && users.data[0];

    // Handle bad username.
    if (!user) {
      return Promise.resolve(false);
    }

    // Handle updating mongoose models
    if (typeof user.toObject === 'function') {
      user = user.toObject();
    }
    // Handle updating Sequelize models
    else if (typeof user.toJSON === 'function') {
      user = user.toJSON();
    }

    debug('User found');
    return Promise.resolve(user);
  }

  updateUser(user, data) {
    const idField = this.options.user.idField;
    const id = user[idField];
    const userService = typeof this._userService === 'string' ? this.app.service(this._userService) : this._userService;

    debug(`Updating user: ${id}`);

    // Merge existing user data with new profile data
    data = merge({}, user, data);

    // TODO (EK): Handle paginated services?
    return userService.patch(id, data, { oauth: true });
  }

  createUser(data) {
    const provider = this.options.provider;
    const id = data[`${provider}Id`];
    const userService = typeof this._userService === 'string' ? this.app.service(this._userService) : this._userService;
    debug(`Creating new user with ${provider}Id: ${id}`);

    return userService.create(data, { oauth: true });
  }

  verify(req, accessToken, refreshToken, profile, done) {
    debug('Checking credentials');
    const options = this.options;
    const query = {
      // facebookId: profile.id
      [`${options.provider}Id`]: profile.id
    };
    const userService = typeof this._userService === 'string' ? this.app.service(this._userService) : this._userService;

    // Find or create the user since they could have signed up via facebook.
    userService
      .find({ query })
      .then(this.getFirstUser)
      .then(user => {
        // TODO (EK): This is where we should look at req.user and see if we
        // can consolidate profiles. We might want to give the developer a hook
        // so that they can control the consolidation strategy.
        const providerData = Object.assign({}, profile._json, { accessToken });

        const data = Object.assign({
          [`${options.provider}Id`]: profile.id,
          [`${options.provider}`]: providerData
        });

        if (user) {
          return this.updateUser(user, data);
        }

        // Otherwise update the existing user
        return this.createUser(data);
      })
      .then(user => done(null, user))
      .catch(error => error ? done(error) : done(null, error));
  }

  // GET /auth/facebook
  find(params) {
    // Authenticate via your provider. This will redirect you to authorize the application.
    return passport.authenticate(this.options.provider, this.options.permissions)(params.req, params.res);
  }

  // For GET /auth/facebook/callback
  get(id, params) {
    // Make sure the provider plugin name doesn't overwrite the OAuth provider name.
    delete params.provider;
    const tokenService = typeof this._tokenService === 'string' ? this.app.service(this._tokenService) : this._tokenService;
    const options = Object.assign({}, this.options, params);

    if (`/${stripSlashes(options.service)}/${id}` !== options.callbackURL) {
      return Promise.reject(new errors.NotFound());
    }

    return new Promise(function(resolve, reject){

      let middleware = passport.authenticate(options.provider, options.permissions, (error, user) => {
        if (error) {
          return reject(error);
        }

        // Login failed.
        if (!user) {
          return reject(new errors.NotAuthenticated(`An error occurred logging in with ${options.provider}`));
        }

        const tokenPayload = {
          [options.user.idField]: user[options.user.idField]
        };

        // Get a new JWT and the associated user from the Auth token service and send it back to the client.
        return tokenService
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
    const tokenService = typeof this._tokenService === 'string' ? this.app.service(this._tokenService) : this._tokenService;

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
          [options.user.idField]: user[options.user.idField]
        };

        // Get a new JWT and the associated user from the Auth token service and send it back to the client.
        return tokenService
          .create(tokenPayload, { user })
          .then(resolve)
          .catch(reject);
      }).bind(this);

      middleware(params.req, params.res);
    });
  }

  setup(app) {
    // attach the app object to the service context
    // so that we can call other services
    this.app = app;

    this._tokenService = this.options.token.service;
    this._userService = this.options.user.service;

    // Register our Passport auth strategy and get it to use our passport callback function
    const Strategy = this.options.strategy;
    const TokenStrategy = this.options.tokenStrategy;

    debug(`registering passport-${this.options.provider} OAuth2 strategy`);
    passport.use(new Strategy(this.options, this.verify.bind(this)));

    if (TokenStrategy) {
      debug(`registering passport-${this.options.provider}-token OAuth2 strategy`);
      passport.use(new TokenStrategy(this.options, this.verify.bind(this)));
    }

    // prevent regular service events from being dispatched
    if (typeof this.filter === 'function') {
      this.filter(() => false);
    }
  }
}

/*
 * Make sure the callbackURL is an absolute URL or relative to the root.
 */
export function normalizeCallbackURL(callbackURL, servicePath){
  if(callbackURL){
    var parsed = url.parse(callbackURL);
    if(!parsed.protocol){
      callbackURL = '/' + stripSlashes(callbackURL);
    }
  } else {
    callbackURL = callbackURL || `/${stripSlashes(servicePath)}/callback`;
  }
  return callbackURL;
}

export default function init (options){
  if (!options.provider) {
    throw new Error('You need to pass a `provider` for your authentication provider');
  }

  if (!options.service) {
    throw new Error(`You need to provide an 'service' for your ${options.provider} provider. This can either be a string or an initialized service.`);
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
    options = merge({ user: {} }, app.get('auth'), app.get('auth').oauth2, options);
    options.callbackURL = normalizeCallbackURL(options.callbackURL, options.service);

    if (options.token === undefined) {
      throw new Error('The TokenService needs to be configured before the OAuth2 service.');
    }

    const Service = options.Service || OAuth2Service;
    const successHandler = options.successHandler || successRedirect;

    debug(`configuring ${options.provider} OAuth2 service with options`, options);

    // TODO (EK): throw warning if cookies are not enabled. They are required for OAuth

    // Initialize our service with any options it requires
    app.use(options.service, new Service(options), setCookie(options), successHandler(options));
  };
}

init.Service = OAuth2Service;
