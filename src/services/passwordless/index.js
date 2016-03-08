import Debug from 'debug';
import errors from 'feathers-errors';
import passwordless from 'passwordless';
import MemoryStore from 'passwordless-memorystore';
import { exposeConnectMiddleware } from '../../middleware';
import { successfulLogin } from '../../middleware';

const debug = Debug('feathers-authentication:passwordless');
const defaults = {
  tokenStore: new MemoryStore(),
  deliveryMethods: [],
  allowTokenReuse: false,
  userIdField: 'id',
  usernameField: 'email'
 };

/**
 * Verifies that the passwordless token is valid. This is a private hook.
 *
 * @param  {Object} options - An options object
 */
let _verifyToken = function(options = {}){

  return function(hook) {
    return new Promise(function(resolve, reject){
      debug('verifying passwrodless token (hook)', hook);
      const token = hook.params.token;
      const uid = hook.params.query.uid;
      
      if(token && uid) {
        // Authenticate token.
        options.tokenStore.authenticate(token, uid, function(error, valid){
          if(error) {
            reject(new errors.NotAuthenticated(error));
          }
          
          if(valid) {
            // Add user id to hook so the next handler can retrieve the user.
            let success = function() {
              hook.params.uid = uid;
              resolve(hook);
            };
            
            // Invalidate one-use tokens.
            if(!options.allowTokenReuse) {
              options.tokenStore.invalidateUser(uid, function(error) {
                if(error) {
                  reject(new errors.NotAuthenticated(error));
                } else {
                  success();
                }
              }); 
            } else {
              success();
            }
          } else {
            return reject(new errors.NotAuthenticated('Token is expired'));
          }
        });
      } else {
        return reject(new errors.NotAuthenticated('Request must have a valid token and uid'));
      }
    });
  };
};

export class Service {
  constructor(options = {}) {
    this.options = options;
  }
  
  /**
   * Retrieves or creates a user.
   *
   * @param  {String} username
   * @param {Function} callback
   */
  getOrCreateUser(username, done) {
    debug('get or create user', username);
    const params = {
      internal: true,
      query: {
        [this.options.usernameField]: username
      }
    };

    // Look up the user.
    this.app.service(this.options.userEndpoint)
      .find(params)
      .then(users => {
      // Paginated services return the array of results in the data attribute.
      let user = users[0] || users.data && users.data[0];

      if (!user) {
         debug('no user found, creating user', username);
         // Create the user
        this.app.service(this.options.userEndpoint)
          .create(params.query)
          .then(user => {
            return done(null, user);
          }).catch(done);
      } else {
        return done(null, user);
      }
    })
    .catch(done);
  }

  // POST /auth/passwordless
  // Requests a passwordless token and delivers it to the user.
  // This will create a new user if they don't already exist.
  create(data, params) {
    const options = this.options;
    const getOrCreateUser = this.getOrCreateUser.bind(this);
    
    return new Promise(function(resolve, reject){
      debug('creating new token for', data.user);
      // Send token.
      let middleware = passwordless.requestToken(function(user, delivery, callback) {
        // Convert username to an id passwordless can use.
        getOrCreateUser(data.user, function(error, user) {
          if(error) {
            return reject(error);
          }
          
          if(user) {
            callback(null, user[options.userIdField]);
            resolve({});
          } else {
            callback(null, null);
            reject(new errors.NotAuthenticated('No user found with id ' + params.uid));
          }
          
        });
      });
      middleware(params.req, params.res, function(){});
    });
  }
  
  // GET /auth/passwordless
  // The link sent to the user will contain token and uid parameters.
  // This takes those, validates them and then creates a JWT token
  find(params) {
    const options = this.options;
    let app = this.app;
    
    return new Promise(function(resolve, reject){
      debug('validating passwordless token', params);
      // Find user from given uid.
      app.service(options.userEndpoint)
        .get(params.uid).then(user => {
          if (!user) {
            debug('no user found', params.uid);
            return reject(new errors.NotAuthenticated('No user found with id ' + params.uid));
          } else {
            // Defer token creation to token service.
            return app.service(options.tokenEndpoint)
              .create(user, { internal: true })
              .then(resolve)
              .catch(reject);
          }
        });
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
  
  debug('configuring passwordless authentication service with options', options);
  
  if (options.deliveryMethods.length === 0) {
    throw new Error('Missing passwordless `deliveryMethod`. There must be at least one.');
  }

  return function() {
    const app = this;
    
    // Initialize passwordless.
    passwordless.init(options.tokenStore);
     
    // Add token delivery methods
    options.deliveryMethods.forEach(method => {
      passwordless.addDelivery(method);
    });

    // Initialize our service with any options it requires.
    app.use(options.passwordlessEndpoint, exposeConnectMiddleware, new Service(options));
    app.post(options.passwordlessEndpoint, successfulLogin(options));
    // Get our initialize service to that we can bind hooks.
    const passwordlessService = app.service(options.passwordlessEndpoint);
    
    passwordlessService.before({
      find: [_verifyToken(options)]
    });
    
  };
}
