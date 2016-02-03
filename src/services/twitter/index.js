import errors from 'feathers-errors';
import passport from 'passport';
import request from 'request';
import Strategy from 'passport-twitter';
import { exposeConnectMiddleware } from '../../middleware';

const defaults = {
  passwordField: 'password',
  userEndpoint: '/users',
  passReqToCallback: true,
  callbackURL: "http://127.0.0.1:3030/auth/twitter/callback"
}

export class Service {
  constructor(options = {}) {
    this.options = options;
  }

  oauthCallback(req, token, tokenSecret, profile, done) {
    let app = this.app;
    const options = this.options;
    const params = {
      internal: true,
      query: {
        twitterId: profile.id
      }
    };

    console.log('Twitter User', token, tokenSecret, profile);

    // Find or create the user since they could have signed up via twitter.
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
          twitterId: profile.id,
          twitterAccessToken: token,
          twitterTokenSecret: tokenSecret,
          twitter: profile._json
        });
        
        return app.service(options.userEndpoint).create(data, { internal: true }).then(user => {
          return done(null, user);
        }).catch(done);
      }).catch(done);
  }

  // GET /auth/twitter
  find(params) {    
    // Authenticate via twitter. This will redirect you to authorize
    // the application.
    return passport.authenticate('twitter', { session: false })(params.req, params.res, function(data){
      console.log('PASSPORT', data);
    });
  }

  // For GET /auth/twitter/reverse
  get(id, params) {
    if (id !== 'reverse' || id !== 'callback') {
      return Promise.reject(new errors.NotFound());
    }

    const options = this.options;
    let app = this.app;

    return new Promise(function(resolve, reject){
    
      let middleware = passport.authenticate('twitter', { session: false }, function(error, user) {
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
    
    // const options = {
    //   url: 'https://api.twitter.com/oauth/request_token',
    //   oauth: {
    //     consumer_key: this.options.consumerKey,
    //     consumer_secret: this.options.consumerSecret
    //   },
    //   form: { x_auth_mode: 'reverse_auth' }
    // }

    // console.log('TWITTER OPTIONS', options);

    // return new Promise(function(resolve, reject){
    //   request.post(options, function (error, response, body) {
    //     console.log(error, response, body);
    //     if (error) {
    //       return reject(error);
    //     }

    //     if (body.indexOf('OAuth') !== 0) {
    //       return reject(new errors.GeneralError('Malformed response from Twitter'));
    //     }

    //     return resolve({ x_reverse_auth_parameters: body });
    //   });
    // });
  }

  // POST /auth/twitter
  create(data, params) {
    // TODO (EK): This should be for token based auth
    console.log('Logging in via twitter', data);
    const options = this.options;
    
    // Authenticate via twitter, then generate a JWT and return it
    return new Promise(function(resolve, reject){
      console.log('Promising');

      let middleware = passport.authenticate('twitter-token', { session: false }, function(error, user) {
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
    app.use('/auth/twitter', exposeConnectMiddleware, new Service(options));

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
