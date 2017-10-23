'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = feathersPassport;

var _initialize = require('./initialize');

var _initialize2 = _interopRequireDefault(_initialize);

var _authenticate = require('./authenticate');

var _authenticate2 = _interopRequireDefault(_authenticate);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('feathers-authentication:passport'); /*
                                                                       * A Feather Passport adapter so that it plays
                                                                       * nicely with Feathers services but remains
                                                                       * engine and transport agnostic.
                                                                       */
function feathersPassport(options) {
  var app = this;

  debug('Initializing Feathers passport adapter');

  return {
    initialize: _initialize2.default.call(app, options),
    authenticate: _authenticate2.default.call(app, options)
  };
}
module.exports = exports['default'];