'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  debug('Registering exposeCookies middleware');

  return function exposeCookies(req, res, next) {
    debug('Exposing Express cookies to hooks and services', req.cookies);
    req.feathers.cookies = req.cookies;
    next();
  };
};

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('feathers-authentication:express:expose-cookies');

module.exports = exports['default'];