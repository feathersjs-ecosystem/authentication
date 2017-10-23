'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = emitEvents;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('feathers-authentication:express:emit-events');

function emitEvents() {
  return function (req, res, next) {
    var method = res.hook && res.hook.method;

    var event = null;

    if (method === 'remove') {
      event = 'logout';
    } else if (method === 'create') {
      event = 'login';
    }

    if (res.data && res.data.accessToken && event) {
      var app = req.app;


      debug('Sending \'' + event + '\' event for REST provider. Token is', res.data.accessToken);

      app.emit(event, res.data, {
        provider: 'rest',
        req: req,
        res: res
      });
    }

    next();
  };
}
module.exports = exports['default'];