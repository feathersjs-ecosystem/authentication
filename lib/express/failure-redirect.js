'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = failureRedirect;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('feathers-authentication:middleware:failure-redirect');

function failureRedirect() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  debug('Registering failureRedirect middleware');

  return function (error, req, res, next) {
    if (options.cookie && options.cookie.enabled) {
      debug('Clearing old \'' + options.cookie.name + '\' cookie');
      res.clearCookie(options.cookie.name);
    }

    if (res.hook && res.hook.data && res.hook.data.__redirect) {
      var _res$hook$data$__redi = res.hook.data.__redirect,
          url = _res$hook$data$__redi.url,
          status = _res$hook$data$__redi.status;

      debug('Redirecting to ' + url + ' after failed authentication.');

      res.status(status || 302);
      return res.redirect(url);
    }

    next(error);
  };
}
module.exports = exports['default'];