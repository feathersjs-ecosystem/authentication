import merge from 'lodash.merge';

export const defaults = {
  service: '/authentication',
  header: 'Authorization',
  setupMiddleware: true,
  successRedirect: null,
  cookie: {
    enabled: false,
    name: 'feathers-jwt',
    httpOnly: false,
    secure: true
  },
  jwt: {
    issuer: 'feathers',
    algorithm: 'HS256',
    expiresIn: '1d'
  },
  user: {
    service: 'users',
    payloadField: 'userId'
  }
};

export default function(... otherOptions) {
  return merge({}, defaults, ... otherOptions);
}
