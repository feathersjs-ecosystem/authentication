'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  for (var _len = arguments.length, otherOptions = Array(_len), _key = 0; _key < _len; _key++) {
    otherOptions[_key] = arguments[_key];
  }

  return _lodash2.default.apply(undefined, [{}, defaults].concat(otherOptions));
};

var _lodash = require('lodash.merge');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaults = {
  path: '/authentication',
  header: 'Authorization',
  entity: 'user',
  service: 'users',
  passReqToCallback: true,
  session: false,
  cookie: {
    enabled: false,
    name: 'feathers-jwt',
    httpOnly: false,
    secure: true
  },
  jwt: {
    header: { typ: 'access' }, // by default is an access token but can be any type
    audience: 'https://yourdomain.com', // The resource server where the token is processed
    subject: 'anonymous', // Typically the entity id associated with the JWT
    issuer: 'feathers', // The issuing server, application or resource
    algorithm: 'HS256',
    expiresIn: '1d'
  }
};

module.exports = exports['default'];