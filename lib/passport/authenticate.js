'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = authenticate;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /*
                                                                                                                                                                                                                   * An authentication function that is called by
                                                                                                                                                                                                                   * app.authenticate. Inspired by
                                                                                                                                                                                                                   * https://github.com/jaredhanson/passport/blob/master/lib/middleware/authenticate.js
                                                                                                                                                                                                                   */


var debug = (0, _debug2.default)('feathers-authentication:passport:authenticate');

function authenticate() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  debug('Initializing custom passport authenticate', options);

  // This function is bound by passport and called by passport.authenticate()
  return function (passport, strategies) {
    var strategyOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var callback = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : function () {};

    // This is called by the feathers middleware, hook or socket. The request object
    // is a mock request derived from an http request, socket object, or hook.
    return function () {
      var request = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return new Promise(function (resolve, reject) {
        // TODO (EK): Support transformAuthInfo

        // Allow you to set a location for the success payload.
        // Default is hook.params.user, req.user and socket.user.
        var entity = strategyOptions.entity || strategyOptions.assignProperty || options.entity;
        request.body = request.body || {};
        var strategyName = request.body.strategy;

        if (!strategyName) {
          if (Array.isArray(strategies)) {
            strategyName = strategies[0];
          } else {
            strategyName = strategies;
          }
        }

        if (!strategyName) {
          return reject(new Error('You must provide an authentication \'strategy\''));
        }

        // Make sure `strategies` is an array, allowing authentication to pass through a chain of
        // strategies.  The first name to succeed, redirect, or error will halt
        // the chain.  Authentication failures will proceed through each strategy in
        // series, ultimately failing if all strategies fail.
        //
        // This is typically used on API endpoints to allow clients to authenticate
        // using their preferred choice of Basic, Digest, token-based schemes, etc.
        // It is not feasible to construct a chain of multiple strategies that involve
        // redirection (for example both Facebook and Twitter), since the first one to
        // redirect will halt the chain.
        if (!Array.isArray(strategies)) {
          strategies = [strategies];
        }

        // Return an error if the client is trying to authenticate with a strategy
        // that the server hasn't allowed for this authenticate call. This is important
        // because it prevents the user from authenticating with a registered strategy
        // that is not being allowed for this authenticate call.
        if (!strategies.includes(strategyName)) {
          return reject(new Error('Invalid authentication strategy \'' + strategyName + '\''));
        }

        // Get the strategy, which will be used as prototype from which to create
        // a new instance.  Action functions will then be bound to the strategy
        // within the context of the HTTP request/response pair.
        var prototype = passport._strategy(strategyName);

        if (!prototype) {
          return reject(new Error('Unknown authentication strategy \'' + strategyName + '\''));
        }

        // Implement required passport methods that
        // can be called by a passport strategy.
        var strategy = Object.create(prototype);

        strategy.redirect = function (url) {
          var status = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 302;

          debug('\'' + strategyName + '\' authentication redirecting to', url, status);
          resolve({ redirect: true, url: url, status: status });
        };

        strategy.fail = function (challenge, status) {
          debug('Authentication strategy \'' + strategyName + '\' failed', challenge, status);
          resolve({
            fail: true,
            challenge: challenge,
            status: status
          });
        };

        strategy.error = function (error) {
          debug('Error in \'' + strategyName + '\' authentication strategy', error);
          reject(error);
        };

        strategy.success = function (data, payload) {
          var _data;

          debug('\'' + strategyName + '\' authentication strategy succeeded', data, payload);
          resolve({
            success: true,
            data: (_data = {}, _defineProperty(_data, entity, data), _defineProperty(_data, 'payload', payload), _data)
          });
        };

        strategy.pass = function () {
          debug('Passing on \'' + strategyName + '\' authentication strategy');
          resolve();
        };

        debug('Passport request object', request);
        strategy.authenticate(request, strategyOptions);
      });
    };
  };
}
module.exports = exports['default'];