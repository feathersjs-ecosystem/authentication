import errors from 'feathers-errors';
import passport from 'passport';
import request from 'request';
import Strategy from 'passport-twitter-token';
import { exposeRequestObject } from '../../middleware';

const defaults = {
  userEndpoint: '/users'
}

export class Service {
  constructor(options = {}) {
    this.options = options;
  }

  oauthCallback(token, tokenSecret, profile, done) {
    const params = {
      internal: true,
      query: {
        twitterId: profile.id
      }
    };

    // TODO (EK): Find or create the user since they could have
    // signed up via twitter.
    // TODO (EK): We'll need to think about account consolidation.
    // This might be the spot.
    app.service(options.userEndpoint)
      .find(params)
      .then(users => {
        // Paginated services return the array of results in the data attribute.
        let user = users[0] || users.data[0];

        // TODO (EK): If no user found, create one
        if (!user) {
          return done(null, false);
        }

        return user;
      })
      .catch(error => {
        // Handle any 500 server errors.
        return done(error);
      });
  }

  // For GET /auth/twitter/reverse
  get(id, params) {
    if (id == 'reverse') {
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

    console.log('TWITTER OPTIONS', options);

    return new Promise(function(resolve, reject){
      request.post(options, function (error, response, body) {
        console.log(error, response, body);
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

  // POST /auth/twitter
  create(data, params) {
    console.log('Logging in via twitter', data);
    const options = this.options;
    
    // Authenticate via twitter, then generate a JWT and return it
    return new Promise(function(resolve, reject){
      console.log('Promising');

      let middleware = passport.authenticate('twitter-token', function(error, user) {
        console.log('RESPONSE', error, user);
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
  console.log('configuring twitter auth service with options', options);

  return function() {
    const app = this;

    // Initialize our service with any options it requires
    app.use('/auth/twitter', exposeRequestObject, new Service(options));

    // Get our initialize service to that we can bind hooks
    const twitterService = app.service('/auth/twitter');

    // Set up our before hooks
    // twitterService.before(hooks.before);

    // Set up our after hooks
    // twitterService.after(hooks.after);
    
    // Register our twitter auth strategy and get it to use the passport callback function
    passport.use(new Strategy(options, twitterService.oauthCallback.bind(twitterService)));
  };
}
