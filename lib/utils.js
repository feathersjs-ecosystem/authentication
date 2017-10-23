'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createJWT = createJWT;
exports.verifyJWT = verifyJWT;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _lodash = require('lodash.pick');

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require('lodash.omit');

var _lodash4 = _interopRequireDefault(_lodash3);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('feathers-authentication:authentication:utils');

function createJWT() {
  var payload = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var VALID_KEYS = ['algorithm', 'expiresIn', 'notBefore', 'audience', 'issuer', 'jwtid', 'subject', 'noTimestamp', 'header', 'exp', 'nbf', 'aud', 'sub', 'iss'];
  var settings = Object.assign({}, options.jwt);
  var secret = options.secret;


  return new Promise(function (resolve, reject) {
    debug('Creating JWT using options', settings);

    if (!secret) {
      return reject(new Error('secret must provided'));
    }

    // TODO (EK): Support jwtids. Maybe auto-generate a uuid
    _jsonwebtoken2.default.sign((0, _lodash4.default)(payload, VALID_KEYS), secret, (0, _lodash2.default)(settings, VALID_KEYS), function (error, token) {
      if (error) {
        debug('Error signing JWT', error);
        return reject(error);
      }

      debug('New JWT issued with payload', payload);
      return resolve(token);
    });
  });
}

function verifyJWT(token) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var VALID_KEYS = ['algorithms', 'audience', 'issuer', 'ignoreExpiration', 'ignoreNotBefore', 'subject', 'clockTolerance'];
  var settings = Object.assign({}, options.jwt);
  var secret = options.secret;

  // normalize algorithm to array

  if (settings.algorithm) {
    settings.algorithms = Array.isArray(settings.algorithm) ? settings.algorithm : [settings.algorithm];
    delete settings.algorithm;
  }

  return new Promise(function (resolve, reject) {
    if (!token) {
      return reject(new Error('token must provided'));
    }

    if (!secret) {
      return reject(new Error('secret must provided'));
    }

    debug('Verifying token', token);
    _jsonwebtoken2.default.verify(token, secret, (0, _lodash2.default)(settings, VALID_KEYS), function (error, payload) {
      if (error) {
        debug('Error verifying token', error);
        return reject(error);
      }

      debug('Verified token with payload', payload);
      resolve(payload);
    });
  });
}