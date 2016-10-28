import merge from 'lodash.merge';

export const defaults = {
  service: '/authentication',
  header: 'Authorization',
  successRedirect: null,
  cookie: {
    enabled: false,
    name: 'feathers-jwt',
    httpOnly: false,
    secure: true
  },
  jwt: {
    subject: 'access',
    issuer: 'feathers',
    algorithm: 'HS256',
    expiresIn: '1d'
  },
  user: {
    service: 'users',
    usernameField: 'email',
    passwordField: 'password',
    // payloadField: 'userId'
  }
};

export default function(... otherOptions) {
  return merge({}, defaults, ... otherOptions);
}
