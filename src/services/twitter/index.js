import errors from 'feathers-errors';
import passport from 'passport';
import request from 'request';
import Strategy from 'passport-twitter-token';

const defaults = {
  userEndpoint: '/users'
}

export class Service {
  constructor(options = {}) {
    this.options = options;
  }

  find(params) {
    return Promise.resolve([]);
  }

  get(id, params) {
    if (id !== 'reverse') {
      return new Promise.reject(new errors.NotFound());
    }
    
    const options = {
      url: 'https://api.twitter.com/oauth/request_token',
      oauth: {
        consumer_key: this.options.consumerKey,
        consumer_secret: this.options.consumerSecret
      },
      form: { x_auth_mode: 'reverse_auth' }
    }
    var self = this;

    return new Promise(function(resolve, reject){
      request.post(options, function (error, response, body) {
        if (error) {
          return reject(error);
        }

        if (body.indexOf('OAuth') !== 0) {
          return reject(new errors.GeneralError('Malformed response from Twitter'));
        }

        return resolve({ x_reverse_auth_parameters: body });
      });
    });
  }

  create(data, params) {
    console.log('Logging in via twitter', data);
    const options = this.options;
    
    // TODO(EK): Authenticate via twitter, then generate a JWT and return it
    return new Promise(function(resolve, reject){
      console.log('Promising');
      passport.authenticate('twitter-token', function(error, user) {
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
        delete user.password;

        const token = jwt.sign(user, options.secret, options);

        return resolve({
          token: token,
          data: user
        });
      });
    });
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
}

export default function(options){
  options = Object.assign(options, defaults);
  console.log('configuring twitter auth service with options', options);

  return function() {
    const app = this;

    // Initialize our service with any options it requires
    app.use('/auth/twitter', new Service(options));

    // Get our initialize service to that we can bind hooks
    const twitterService = app.service('/auth/twitter');

    let twitterHandler = function(token, tokenSecret, profile, done) {
      const params = {
        internal: true,
        query: {
          twitterId: profile.id
        }
      };

      // Look up the user
      app.service(options.userEndpoint)
        .find(params)
        .then(users => {
          // Paginated services return the array of results in the data attribute.
          let user = users[0] || users.data[0];

          // If no user found, create one
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
    // twitterService.before(hooks.before);

    // Set up our after hooks
    // twitterService.after(hooks.after);
    
    passport.use(new Strategy(options, twitterHandler));
  };
}
