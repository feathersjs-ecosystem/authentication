'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  debug('Registering exposeHeaders middleware');

  return function exposeHeaders(req, res, next) {
    debug('Exposing Express headers to hooks and services');
    req.feathers.headers = req.headers;
    next();
  };
};

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('feathers-authentication:express:expose-headers');

module.exports = exports['default'];