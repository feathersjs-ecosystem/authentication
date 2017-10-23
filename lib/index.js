'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = init;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _hooks = require('./hooks');

var _hooks2 = _interopRequireDefault(_hooks);

var _express = require('./express');

var _express2 = _interopRequireDefault(_express);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _passport3 = require('./passport');

var _passport4 = _interopRequireDefault(_passport3);

var _options = require('./options');

var _options2 = _interopRequireDefault(_options);

var _service = require('./service');

var _service2 = _interopRequireDefault(_service);

var _socket = require('./socket');

var _socket2 = _interopRequireDefault(_socket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('feathers-authentication:index');

function init() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return function authentication() {
    var app = this;
    var _super = app.setup;
    // Merge and flatten options
    var options = (0, _options2.default)(config);

    if (app.passport) {
      throw new Error('You have already registered authentication on this app. You only need to do it once.');
    }

    if (!options.secret) {
      throw new Error('You must provide a \'secret\' in your authentication configuration');
    }

    // Make sure cookies don't have to be sent over HTTPS
    // when in development or test mode.
    if (app.get('env') === 'development' || app.get('env') === 'test') {
      options.cookie.secure = false;
    }

    app.set('auth', options);

    debug('Setting up Passport');
    // Set up our framework adapter
    _passport2.default.framework(_passport4.default.call(app, options));
    // Expose passport on the app object
    app.passport = _passport2.default;
    // Alias to passport for less keystrokes
    app.authenticate = _passport2.default.authenticate.bind(_passport2.default);
    // Expose express request headers to Feathers services and hooks.
    app.use(_express2.default.exposeHeaders());

    if (options.cookie.enabled) {
      // Expose express cookies to Feathers services and hooks.
      debug('Setting up Express exposeCookie middleware');
      app.use(_express2.default.exposeCookies());
    }

    // TODO (EK): Support passing your own service or force
    // developer to register it themselves.
    app.configure((0, _service2.default)(options));
    app.passport.initialize();

    app.setup = function () {
      var result = _super.apply(this, arguments);

      // Socket.io middleware
      if (app.io) {
        debug('registering Socket.io authentication middleware');
        app.io.on('connection', _socket2.default.socketio(app, options));
      }

      // Primus middleware
      if (app.primus) {
        debug('registering Primus authentication middleware');
        app.primus.on('connection', _socket2.default.primus(app, options));
      }

      return result;
    };
  };
}

// Exposed Modules
Object.assign(init, {
  hooks: _hooks2.default,
  express: _express2.default,
  service: _service2.default
});
module.exports = exports['default'];