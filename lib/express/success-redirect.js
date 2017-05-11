'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = successRedirect;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('feathers-authentication:middleware:success-redirect');

function successRedirect() {
  debug('Registering successRedirect middleware');

  return function (req, res, next) {
    if (res.hook && res.hook.data && res.hook.data.__redirect) {
      var _res$hook$data$__redi = res.hook.data.__redirect,
          url = _res$hook$data$__redi.url,
          status = _res$hook$data$__redi.status;

      debug('Redirecting to ' + url + ' after successful authentication.');

      res.status(status || 302);
      return res.redirect(url);
    }

    next();
  };
}
module.exports = exports['default'];