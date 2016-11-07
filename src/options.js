import merge from 'lodash.merge';

const defaults = {
  service: '/authentication',
  header: 'Authorization',
  cookie: {
    enabled: false,
    name: 'feathers-jwt',
    httpOnly: false,
    secure: true
  },
  jwt: {
    header: { typ: 'jwt' },
    audience: 'user',
    subject: 'access',
    issuer: 'feathers',
    algorithm: 'HS256',
    expiresIn: '1d'
  },
  user: {
    service: 'users',
    usernameField: 'email',
    passwordField: 'password'
  }
};

export default function(... otherOptions) {
  return merge({}, defaults, ... otherOptions);
}
