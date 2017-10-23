'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = authenticate;

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('feathers-authentication:express:authenticate');

function authenticate(strategy) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  // TODO (EK): Support arrays of strategies

  if (!strategy) {
    throw new Error('The \'authenticate\' hook requires one of your registered passport strategies.');
  }

  return function (req, res, next) {
    // If we are already authenticated skip
    if (req.authenticated) {
      return next();
    }

    // if (!req.app.passport._strategy(strategy)) {
    //   return next(new Error(`Your '${strategy}' authentication strategy is not registered with passport.`));
    // }
    // TODO (EK): Can we do something in here to get away
    // from express-session for OAuth1?
    // TODO (EK): Handle chaining multiple strategies
    req.app.authenticate(strategy, options)(req).then(function () {
      var result = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      // TODO (EK): Support passport failureFlash
      // TODO (EK): Support passport successFlash
      if (result.success) {
        Object.assign(req, { authenticated: true }, result.data);
        Object.assign(req.feathers, { authenticated: true }, result.data);

        if (options.successRedirect && !options.__oauth) {
          debug('Redirecting to ' + options.successRedirect);
          res.status(302);
          return res.redirect(options.successRedirect);
        }

        return next();
      }

      if (result.fail) {
        if (options.failureRedirect && !options.__oauth) {
          debug('Redirecting to ' + options.failureRedirect);
          res.status(302);
          return res.redirect(options.failureRedirect);
        }

        var challenge = result.challenge,
            _result$status = result.status,
            status = _result$status === undefined ? 401 : _result$status;

        var message = challenge && challenge.message ? challenge.message : challenge;

        if (options.failureMessage) {
          message = options.failureMessage;
        }

        res.status(status);
        return Promise.reject(new _feathersErrors2.default[status](message, challenge));
      }

      if (result.redirect) {
        debug('Redirecting to ' + result.url);
        res.status(result.status);
        return res.redirect(result.url);
      }

      // Only gets here if pass() is called by the strategy
      next();
    }).catch(next);
  };
}
module.exports = exports['default'];