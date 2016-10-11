import merge from 'lodash.merge';

// Options that apply to any provider
export const defaults = {
  header: 'Authorization',
  setupMiddleware: true, // optional - to setup middleware yourself set to false.
  cookie: { // Used for redirects, server side rendering and OAuth
    enabled: false, // Set to true to enable all cookies
    name: 'feathers-jwt',
    httpOnly: true,
    maxAge: '1d',
    secure: true
  },
  jwt: {
    issuer: 'feathers',
    algorithm: 'HS256',
    expiresIn: '1d'
  },
  token: {
    name: 'token', // optional
    service: '/auth/token', // optional string or Service
    subject: 'auth', // optional
    issuer: 'feathers', // optional
    algorithm: 'HS256', // optional
    expiresIn: '1d', // optional
    secret: null, // required
    successRedirect: null, // optional - no default. If set the default success handler will redirect to location
    failureRedirect: null, // optional - no default. If set the default success handler will redirect to location
    successHandler: null // optional - a middleware to handle things once authentication succeeds
  },
  local: {
    service: '/auth/local', // optional string or Service
    successRedirect: null, // optional - no default. If set the default success handler will redirect to location
    failureRedirect: null, // optional - no default. If set the default success handler will redirect to location
    successHandler: null, // optional - a middleware to handle things once authentication succeeds
    passReqToCallback: true, // optional - whether request should be passed to callback
    session: false // optional - whether we should use a session
  },
  user: {
    service: '/users', // optional string or Service
    idField: '_id', // optional
    usernameField: 'email', // optional
    passwordField: 'password', // optional
    crypto: 'bcryptjs'
  },
  oauth2: {
    // service: '/auth/facebook', // required - the service path or initialized service
    passReqToCallback: true, // optional - whether request should be passed to callback
    // callbackUrl: 'callback', // optional - the callback url, by default this gets set to /<service>/callback
    permissions: {
      state: true,
      session: false
    }
  }
};

export default function(... otherOptions) {
  return merge({}, defaults, ... otherOptions);
}
