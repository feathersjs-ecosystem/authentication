'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = authenticate;

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _lodash = require('lodash.merge');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('feathers-authentication:hooks:authenticate');

function authenticate(strategies) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (!strategies) {
    throw new Error('The \'authenticate\' hook requires one of your registered passport strategies.');
  }

  return function (hook) {
    var app = hook.app;

    // If called internally or we are already authenticated skip
    if (!hook.params.provider || hook.params.authenticated) {
      return Promise.resolve(hook);
    }

    if (hook.type !== 'before') {
      return Promise.reject(new Error('The \'authenticate\' hook should only be used as a \'before\' hook.'));
    }

    hook.data = hook.data || {};

    var strategy = hook.data.strategy;

    if (!strategy) {
      if (Array.isArray(strategies)) {
        strategy = strategies[0];
      } else {
        strategy = strategies;
      }
    }

    // Handle the case where authenticate hook was registered without a passport strategy specified
    if (!strategy) {
      return Promise.reject(new _feathersErrors2.default.GeneralError('You must provide an authentication \'strategy\''));
    }

    // The client must send a `strategy` name.
    if (!app.passport._strategy(strategy)) {
      return Promise.reject(new _feathersErrors2.default.BadRequest('Authentication strategy \'' + strategy + '\' is not registered.'));
    }

    // NOTE (EK): Passport expects an express/connect
    // like request object. So we need to create one.
    var request = {
      query: hook.data,
      body: hook.data,
      params: hook.params,
      headers: hook.params.headers || {},
      cookies: hook.params.cookies || {},
      session: {}
    };

    var strategyOptions = (0, _lodash2.default)({}, app.passport.options(strategy), options);

    debug('Attempting to authenticate using ' + strategy + ' strategy with options', strategyOptions);

    return app.authenticate(strategy, strategyOptions)(request).then(function () {
      var result = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if (result.fail && options.allowUnauthenticated !== true) {
        // TODO (EK): Reject with something...
        // You get back result.challenge and result.status
        if (strategyOptions.failureRedirect) {
          // TODO (EK): Bypass the service?
          // hook.result = true
          Object.defineProperty(hook.data, '__redirect', { value: { status: 302, url: strategyOptions.failureRedirect } });
        }

        var challenge = result.challenge,
            _result$status = result.status,
            status = _result$status === undefined ? 401 : _result$status;

        var message = challenge && challenge.message ? challenge.message : challenge;

        if (strategyOptions.failureMessage) {
          message = strategyOptions.failureMessage;
        }

        return Promise.reject(new _feathersErrors2.default[status](message, challenge));
      }

      if (result.success || options.allowUnauthenticated === true) {
        hook.params = Object.assign({ authenticated: result.success }, hook.params, result.data);

        // Add the user to the original request object so it's available in the socket handler
        Object.assign(request.params, hook.params);

        if (strategyOptions.successRedirect) {
          // TODO (EK): Bypass the service?
          // hook.result = true
          Object.defineProperty(hook.data, '__redirect', { value: { status: 302, url: strategyOptions.successRedirect } });
        }
      } else if (result.redirect) {
        // TODO (EK): Bypass the service?
        // hook.result = true
        Object.defineProperty(hook.data, '__redirect', { value: { status: result.status, url: result.url } });
      }

      return Promise.resolve(hook);
    });
  };
}
module.exports = exports['default'];