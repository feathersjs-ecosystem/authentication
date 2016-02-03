import errors from 'feathers-errors';
import passport from 'passport';
import Strategy from 'passport-facebook';
import { exposeConnectMiddleware } from '../../middleware';

const defaults = {
  passwordField: 'password',
  userEndpoint: '/users',
  passReqToCallback: true,
  callbackURL: "http://localhost:3030/auth/facebook/callback"
}

export class Service {
  constructor(options = {}) {
    this.options = options;
  }

  oauthCallback(req, accessToken, refreshToken, profile, done) {
    let app = this.app;
    const options = this.options;
    const params = {
      internal: true,
      query: {
        facebookId: profile.id
      }
    };

    // console.log('Authenticating', accessToken, refreshToken, profile);

    // Find or create the user since they could have signed up via facebook.
    app.service(options.userEndpoint)
      .find(params)
      .then(users => {
        // Paginated services return the array of results in the data attribute.
        let user = users[0] || users.data && users.data[0];

        // If user found return them
        if (user) {
          return done(null, user);
        }

        // No user found so we need to create one.
        // 
        // TODO (EK): This is where we should look at
        // req.user and see if we can consolidate profiles.

        let data = Object.assign({
          facebookId: profile.id,
          facebookAccessToken: accessToken,
          facebook: profile._json
        });
        
        return app.service(options.userEndpoint).create(data, { internal: true }).then(user => {
          return done(null, user);
        }).catch(done);
      }).catch(done);
  }

  // GET /auth/facebook
  find(params) {    
    // Authenticate via facebook. This will redirect you to authorize
    // the application.
    return passport.authenticate('facebook', { session: false })(params.req, params.res);
  }

  // For GET /auth/facebook/callback
  get(id, params) {
    if (id !== 'callback') {
      return Promise.reject(new errors.NotFound());
    }

    const options = this.options;
    let app = this.app;

    return new Promise(function(resolve, reject){
    
      let middleware = passport.authenticate('facebook', { session: false }, function(error, user) {
        if (error) {
          return reject(error);
        }

        // Login failed.
        if (!user) {
          return reject(new errors.NotAuthenticated(options.loginError));
        }

        // Login was successful. Clean up the user object for the response.
        user = Object.assign({}, user = !user.toJSON ? user : user.toJSON());
        delete user[options.passwordField];

        // Get a new JWT from the Auth token service and send it back to the client.
        return app.service('/auth/token').create(user, { internal: true }).then(data => {
          return resolve({
            token: data.token,
            data: user
          });
        }).catch(reject);
      });

      middleware(params.req, params.res);
    });
  }

  // POST /auth/facebook
  create(data, params) {
    // TODO (EK): This should be for token based auth
    const options = this.options;
    
    // Authenticate via facebook, then generate a JWT and return it
    return new Promise(function(resolve, reject){
      let middleware = passport.authenticate('facebook-token', { session: false }, function(error, user) {
        if (error) {
          return reject(error);
        }

        // Login failed.
        if (!user) {
          return reject(new errors.NotAuthenticated(options.loginError));
        }

        // Login was successful. Generate and send token.
        user = Object.assign({}, user = !user.toJSON ? user : user.toJSON());
        delete user[options.passwordField];

        // TODO (EK): call this.app.service('/auth/token').create() instead
        const token = jwt.sign(user, options.secret, options);

        return resolve({
          token: token,
          data: user
        });
      });

      middleware(params.req);
    });
  }

  setup(app) {
    // attach the app object to the service context
    // so that we can call other services
    this.app = app;
  }
}

export default function(options){
  options = Object.assign(options, defaults);
  console.log('configuring facebook auth service with options', options);

  return function() {
    const app = this;

    // Initialize our service with any options it requires
    app.use('/auth/facebook', exposeConnectMiddleware, new Service(options));

    // Get our initialize service to that we can bind hooks
    const facebookService = app.service('/auth/facebook');

    // Set up our before hooks
    // facebookService.before(hooks.before);

    // Set up our after hooks
    // facebookService.after(hooks.after);
    
    // Register our facebook auth strategy and get it to use the passport callback function
    passport.use(new Strategy(options, facebookService.oauthCallback.bind(facebookService)));
  };
}
