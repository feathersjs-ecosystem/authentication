'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _setCookie = require('./set-cookie');

var _setCookie2 = _interopRequireDefault(_setCookie);

var _successRedirect = require('./success-redirect');

var _successRedirect2 = _interopRequireDefault(_successRedirect);

var _failureRedirect = require('./failure-redirect');

var _failureRedirect2 = _interopRequireDefault(_failureRedirect);

var _authenticate = require('./authenticate');

var _authenticate2 = _interopRequireDefault(_authenticate);

var _exposeHeaders = require('./expose-headers');

var _exposeHeaders2 = _interopRequireDefault(_exposeHeaders);

var _exposeCookies = require('./expose-cookies');

var _exposeCookies2 = _interopRequireDefault(_exposeCookies);

var _emitEvents = require('./emit-events');

var _emitEvents2 = _interopRequireDefault(_emitEvents);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  exposeHeaders: _exposeHeaders2.default,
  exposeCookies: _exposeCookies2.default,
  authenticate: _authenticate2.default,
  setCookie: _setCookie2.default,
  successRedirect: _successRedirect2.default,
  failureRedirect: _failureRedirect2.default,
  emitEvents: _emitEvents2.default
};
module.exports = exports['default'];