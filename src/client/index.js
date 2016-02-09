import hooks from './hooks';

const defaults = {
  userEndpoint: '/users',
  localEndpoint: '/auth/local',
  tokenEndpoint: '/auth/token'
}

export default function(options = {}) {
  options = Object.assign({}, defaults, options);

  return function() {
    const app = this;

    app.authenticate = function() {
      // To authentication here
    }

    // Set up hook that adds adds token to data sent to server over sockets
    app.mixins.push(function(service) {
      service.before(hooks.populateParams());
    });
    
    // Set up hook that adds authorization header
    if (app.rest) {
      app.mixins.push(function(service) {
        service.before(hooks.populateHeader(options));
      });
    }

    // Set up hook that adds adds token to data sent to server over sockets
    if (app.io || app.primus) {
      app.mixins.push(function(service) {
        service.before(hooks.populateSocketParams());
      });
    }
  };
}
