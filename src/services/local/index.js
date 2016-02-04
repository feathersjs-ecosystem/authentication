import hooks from '../../hooks';
import errors from 'feathers-errors';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { Strategy } from 'passport-local';
import { exposeRequestObject } from '../../middleware';
import { successfulLogin } from '../../middleware';

const defaults = {
  userEndpoint: '/users',
  usernameField: 'email',
  passwordField: 'password',
  userProperty: passport._userProperty || 'user',
  localEndpoint: '/auth/local',
  tokenEndpoint: '/auth/token'
};

export class Service {
  constructor(options = {}) {
    this.options = options;
  }

  checkCredentials(username, password, done) {
    const params = {
      internal: true,
      query: {
        [this.options.usernameField]: username
      }
    };

    // Look up the user
    this.app.service(this.options.userEndpoint)
      .find(params)
      .then(users => {
        // Paginated services return the array of results in the data attribute.
        let user = users[0] || users.data[0];

        // Handle bad username.
        if (!user) {
          return done(null, false);
        }

        return user;
      })
      .then(user => {
        // Check password
        bcrypt.compare(password, user[this.options.passwordField], function(error, result) {
          // Handle 500 server error.
          if (error) {
            return done(error);
          }
          // Successful login.
          if (result) {
            return done(null, user);
          }
          // Handle bad password.
          return done(null, false);
        });
      })
      .catch(done);
  }

  // POST /auth/local
  create(data, params) {
    const options = this.options;
    let app = this.app;

    // Validate username and password, then generate a JWT and return it
    return new Promise(function(resolve, reject){    
      let middleware = passport.authenticate('local', { session: false }, function(error, user) {
        if (error) {
          return reject(error);
        }

        // Login failed.
        if (!user) {
          return reject(new errors.NotAuthenticated('Invalid login.'));
        }

        // Login was successful. Generate and send token.
        user = Object.assign({}, user = !user.toJSON ? user : user.toJSON());

        // remove the user password field so we don't expose it in the response.
        delete user[options.passwordField];

        // Get a new token from the Auth token service
        return app.service(options.tokenEndpoint).create(user, { internal: true }).then(data => {
          return resolve({
            token: data.token,
            data: user
          });
        }).catch(reject);
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
  options = Object.assign({}, defaults, options);
  console.log('configuring local auth service with options', options);

  return function() {
    const app = this;

    // Initialize our service with any options it requires
    app.use(options.localEndpoint, exposeRequestObject, new Service(options), successfulLogin(options));

    // Get our initialize service to that we can bind hooks
    const localService = app.service(options.localEndpoint);

    // Set up our before hooks
    // localService.before(hooks.before);

    // Set up our after hooks
    // localService.after(hooks.after);
    
    // Register our local auth strategy and get it to use the passport callback function
    passport.use(new Strategy(options, localService.checkCredentials.bind(localService)));
  }
}
