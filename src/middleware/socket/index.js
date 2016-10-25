import Debug from 'debug';
import setupSocketHandler from './handler';

const debug = Debug('feathers-authentication:sockets');

export function socketioHandler(app, options = {}) {
  debug('Setting up Socket.io authentication middleware with options:', options);

  const providerSettings = {
    provider: 'socketio',
    emit: 'emit',
    disconnect: 'disconnect',
    feathersParams(socket) {
      return socket.feathers;
    }
  };

  return setupSocketHandler(app, options, providerSettings);
}

export function primusHandler(app, options = {}) {
  debug('Setting up Primus authentication middleware with options:', options);

  const providerSettings = {
    provider: 'primus',
    emit: 'send',
    disconnect: 'end',
    feathersParams(socket) {
      return socket.request.feathers;
    }
  };

  return setupSocketHandler(app, options, providerSettings);
}

export default function(options) {
  return function() {
    const app = this;
    const _super = app.setup;

    app.setup = function() {
      let result = _super.apply(this, arguments);

      // Socket.io middleware
      if (app.io) {
        debug('registering Socket.io authentication middleware');
        app.io.on('connection', socketioHandler(app, options));
      }

      // Primus middleware
      if (app.primus) {
        debug('registering Primus authentication middleware');
        app.primus.on('connection', primusHandler(app, options));
      }

      return result;
    };
  };
}
