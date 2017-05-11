'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initialize;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('feathers-authentication:passport:initialize');

function initialize() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  // const app = this;

  debug('Initializing custom passport initialize', options);

  // Do any special feathers passport initialization here. We may need this
  // to support different engines.
  return function (passport) {
    // NOTE (EK): This is called by passport.initialize() when calling
    // app.configure(authentication()).

    // Expose our JWT util functions globally
    passport._feathers = {};
    passport.createJWT = _utils.createJWT;
    passport.verifyJWT = _utils.verifyJWT;
    passport.options = function (name, strategyOptions) {
      if (!name) {
        return passport._feathers;
      }

      if (typeof name === 'string' && !strategyOptions) {
        return passport._feathers[name];
      }

      if (typeof name === 'string' && strategyOptions) {
        debug('Setting ' + name + ' strategy options', strategyOptions);
        passport._feathers[name] = Object.assign({}, strategyOptions);
      }
    };
  };
}
module.exports = exports['default'];