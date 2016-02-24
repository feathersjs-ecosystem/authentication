import * as hooks from './hooks';

const defaults = {
  storage: '/storage',
  localEndpoint: '/auth/local',
  tokenEndpoint: '/auth/token'
};

export default function(opts = {}) {
  const authOptions = Object.assign({}, defaults, opts);

  return function() {
    const app = this;
    const storage = () => app.service(authOptions.storage);
    const handleResponse = function (response) {
      return storage().create([{
        id: 'token',
        value: response.token
      }, {
        id: 'user',
        value: response.data
      }]).then(() => response);
    };

    app.authenticate = function(options) {
      if (!options.type) {
        throw new Error('You need to provide a `type` attribute when calling app.authenticate()');
      }

      let endPoint;

      if (options.type === 'local') {
        endPoint = authOptions.localEndpoint;
      } else if (options.type === 'token') {
        endPoint = authOptions.tokenEndpoint;
      } else {
        throw new Error(`Unsupported authentication 'type': ${options.type}`);
      }

      return new Promise(function(resolve, reject) {
        // TODO (EK): Handle OAuth logins
        // If we are using a REST client
        if (app.rest) {
          return app.service(endPoint).create(options).then(handleResponse);
        }

        if (app.io || app.primus) {
          const transport = app.io ? 'io' : 'primus';

          app[transport].on('unauthorized', reject);
          app[transport].on('authenticated', response => 
            handleResponse(response).then(reponse => resolve(reponse))
          );
        }

        // If we are using socket.io
        if (app.io) {
          // If we aren't already connected then throw an error
          if (!app.io.connected) {
            throw new Error('Socket not connected');
          }

          app.io.on('disconnect', reject);
          app.io.emit('authenticate', options);
        }

        // If we are using primus
        if (app.primus) {
          // If we aren't already connected then throw an error
          if (app.primus.readyState !== 3) {
            throw new Error('Socket not connected');
          }

          app.primus.on('close', reject);
          app.primus.send('authenticate', options);
        }
      });
    };

    app.user = function() {
      return storage().get('user')
        .then(data => data.value);
    };
    
    app.token = function() {
      return storage().get('token')
        .then(data => data.value);
    };

    app.logout = function() {
      return Promise.all(
        storage().remove('user'),
        storage().remove('token')
      );
    };

    // Set up hook that adds adds token and user to params so that
    // it they can be accessed by client side hooks and services
    app.mixins.push(function(service) {
      service.before(hooks.populateParams(authOptions));
    });
    
    // Set up hook that adds authorization header for REST provider
    if (app.rest) {
      app.mixins.push(function(service) {
        service.before(hooks.populateHeader(authOptions));
      });
    }
  };
}
