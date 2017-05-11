'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.socketio = socketio;
exports.primus = primus;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _handler = require('./handler');

var _handler2 = _interopRequireDefault(_handler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('feathers-authentication:sockets');

function socketio(app) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  debug('Setting up Socket.io authentication middleware with options:', options);

  var providerSettings = {
    provider: 'socketio',
    emit: 'emit',
    disconnect: 'disconnect',
    feathersParams: function feathersParams(socket) {
      return socket.feathers;
    }
  };

  return (0, _handler2.default)(app, options, providerSettings);
}

function primus(app) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  debug('Setting up Primus authentication middleware with options:', options);

  var providerSettings = {
    provider: 'primus',
    emit: 'send',
    disconnect: 'end',
    feathersParams: function feathersParams(socket) {
      return socket.request.feathers;
    }
  };

  return (0, _handler2.default)(app, options, providerSettings);
}

exports.default = {
  socketio: socketio,
  primus: primus
};