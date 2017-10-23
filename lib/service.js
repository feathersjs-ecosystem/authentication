'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = init;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _lodash = require('lodash.merge');

var _lodash2 = _interopRequireDefault(_lodash);

var _express = require('./express');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = (0, _debug2.default)('feathers-authentication:authentication:service');

var Service = function () {
  function Service(app) {
    _classCallCheck(this, Service);

    this.app = app;
    this.passport = app.passport;
  }

  _createClass(Service, [{
    key: 'create',
    value: function create() {
      var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var defaults = this.app.get('auth');
      var payload = (0, _lodash2.default)(data.payload, params.payload);

      // create accessToken
      // TODO (EK): Support refresh tokens
      // TODO (EK): This should likely be a hook
      // TODO (EK): This service can be datastore backed to support blacklists :)
      return this.passport.createJWT(payload, (0, _lodash2.default)({}, defaults, params)).then(function (accessToken) {
        return { accessToken: accessToken };
      });
    }
  }, {
    key: 'remove',
    value: function remove(id, params) {
      var defaults = this.app.get('auth');
      var authHeader = params.headers && params.headers[defaults.header.toLowerCase()];
      var authParams = authHeader && authHeader.match(/(\S+)\s+(\S+)/);
      var accessToken = id !== null ? id : authParams && authParams[2] || authHeader;

      // TODO (EK): return error if token is missing?
      return this.passport.verifyJWT(accessToken, (0, _lodash2.default)(defaults, params)).then(function (payload) {
        return { accessToken: accessToken };
      });
    }
  }]);

  return Service;
}();

function init(options) {
  return function () {
    var app = this;
    var path = options.path;

    if (typeof path !== 'string') {
      throw new Error('You must provide a \'path\' in your authentication configuration or pass one explicitly.');
    }

    debug('Configuring authentication service at path', path);

    app.use(path, new Service(app, options), (0, _express.emitEvents)(options), (0, _express.setCookie)(options), (0, _express.successRedirect)(), (0, _express.failureRedirect)(options));

    var service = app.service(path);

    if (typeof service.filter === 'function') {
      service.filter(function () {
        return false;
      });
    }
  };
}

init.Service = Service;
module.exports = exports['default'];