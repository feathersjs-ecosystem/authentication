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

  find(params) {
    return Promise.reject(new errors.NotImplemented());
  }

  get(id, params) {
    return Promise.reject(new errors.NotImplemented());
  }

  create(data, params) {
    console.log('Logging in', data);
    const options = this.options;
    // TODO(EK): Validate username and password, then generate a JWT and return it
    // passport.authenticate('local', { session: false }, function(error, user) {
    //   console.log('RESPONSE', error, user);
    //   if (error) {
    //     return reject(error);
    //   }

    //   // Login failed.
    //   if (!user) {
    //     return reject(new errors.NotAuthenticated(options.loginError));
    //   }

    //   // Login was successful. Generate and send token.
    //   user = !user.toJSON ? user : user.toJSON();
    //   delete user.password;

    //   const token = jwt.sign(user, options.secret, options);

    //   return resolve({
    //     token: token,
    //     data: user
    //   });
    // });
    // return new Promise(function(resolve, reject){
    //   console.log('Promising');
      
    // });
  }

  update(id, data, params) {
    return Promise.reject(new errors.NotImplemented());
  }

  patch(id, data, params) {
    return Promise.reject(new errors.NotImplemented());
  }

  remove(id, params) {
    return Promise.reject(new errors.NotImplemented());
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

    let middlware = function(req, res, next) {
      passport.authenticate('local', { session: false }, function(error, user) {
        console.log('RESPONSE', error, user);
        if (error) {
          return next(error);
        }

        // Login failed.
        if (!user) {
          return next(new errors.NotAuthenticated(options.loginError));
        }

        // Login was successful. Generate and send token.
        user = !user.toJSON ? user : user.toJSON();
        delete user.password;

        app.service('/auth/token').create(user, { internal: true }).then(token => {
          const data = Object.assign(token, { data: user});
          res.json(data);
        })
        .catch(error => {
          next(error);  
        });
      })(req, res);
    }

    // Initialize our service with any options it requires
    app.use('/auth/local', middlware, new Service(options));

    // Get our initialize service to that we can bind hooks
    const localService = app.service('/auth/local');

    let emailHandler = function(username, password, done) {
      const params = {
        internal: true,
        query: {}
      };
      params.query[options.usernameField] = username;

      // Look up the user
      app.service(options.userEndpoint)
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
          bcrypt.compare(password, user[options.passwordField], function(error, res) {
            // Handle 500 server error.
            if (error) {
              return done(error);
            }
            // Successful login.
            if (res) {
              return done(null, user);
            }
            // Handle bad password.
            return done(null, false);
          });
        })
        .catch(error => {
          // Handle any 500 server errors.
          return done(error);
        });
    };
    // Set up our before hooks
    // localService.before({
    //   find: []
    // });

    // Set up our after hooks
    // localService.after(hooks.after);
    
    // Register our local auth strategy and get it to use the passport callback function
    passport.use(new Strategy(options, emailHandler));
  }
}
