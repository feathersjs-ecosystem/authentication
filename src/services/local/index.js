import hooks from '../../hooks';
import errors from 'feathers-errors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy } from 'passport-local';

const defaults = {
  userEndpoint: '/users',
  usernameField: 'email',
  passwordField: 'password',
  userProperty: passport._userProperty || 'user',
  localAuthEndpoint: '/auth/local',
  loginError: 'Invalid login.'
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

  create(data, params) {
    // console.log('Logging in', data);
    const options = this.options;

    // // TODO(EK): Validate username and password, then generate a JWT and return it
    return new Promise(function(resolve, reject){
      console.log('Promising');
    
      let middleware = passport.authenticate('local', { session: false }, function(error, user) {
        console.log('RESPONSE', error, user);
        if (error) {
          return reject(error);
        }

        // Login failed.
        if (!user) {
          return reject(new errors.NotAuthenticated(options.loginError));
        }

        // Login was successful. Generate and send token.
        user = !user.toJSON ? user : user.toJSON();

        // it should be moved to an after hook
        delete user[options.passwordField];
          
        // call this.app.service('/auth/token').create()
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
    this.app = app;
    console.log('Setting up local auth service');
  }
}

export default function(options){
  options = Object.assign(options, defaults);

  console.log('configuring local auth service with options', options);

  return function() {
    const app = this;

    // Usually this is a big no no but passport requires the 
    // request object to inspect req.body and req.query
    let passRequest = function(req, res, next) {
      req.feathers.req = req;
      next();
    }

    // Initialize our service with any options it requires
    app.use('/auth/local', passRequest, new Service(options));

    // Get our initialize service to that we can bind hooks
    const localService = app.service('/auth/local');

    // Set up our before hooks
    // localService.before({
    //   find: []
    // });

    // Set up our after hooks
    // localService.after(hooks.after);
    
    // Register our local auth strategy and get it to use the passport callback function
    passport.use(new Strategy(options, localService.checkCredentials.bind(localService)));
  }
}
