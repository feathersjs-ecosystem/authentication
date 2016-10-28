import Debug from 'debug';
import jwt from 'jsonwebtoken';

const debug = Debug('feathers-authentication:authentication:utils');

// Returns a { token } object either from a string,
// an HTTP request object or another object with a `.token` property
export function getJWT (data) {
  const { header } = this.options;

  if (typeof data === 'string') {
    return Promise.resolve({ accessToken: data });
  } else if (typeof data === 'object' && data.headers) {
    const req = data;

    debug('Parsing accessToken from request');

    // Normalize header capitalization the same way Node.js does
    let accessToken = req.headers && req.headers[header.toLowerCase()];

    // Check the header for the accessToken (preferred method)
    if (accessToken) {
      // if the value contains "bearer" or "Bearer" then cut that part out
      if (/bearer/i.test(accessToken)) {
        accessToken = accessToken.split(' ')[1];
      }

      debug('accessToken found in header', accessToken);
    }

    return Promise.resolve({ accessToken });
  } else if (typeof data === 'object' && data.accessToken) {
    return Promise.resolve({ accessToken: data.accessToken });
  }

  return Promise.resolve();
}

export function verifyJWT (token, params = {}, options = {}) {
  const settings = Object.assign({}, options.jwt, params.jwt);
  const { secret } = options;

  debug('Verifying token', token);

  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, settings, (error, payload) => {
      if(error) {
        debug('Error verifying token', error);
        return reject(error);
      }

      debug('Verified token with payload', payload);
      resolve({ token, payload });
    });
  });
}

export function createJWT (payload = {}, params = {}, options = {}) {
  const settings = Object.assign({}, options.jwt, params.jwt);
  const { secret } = options;

  return new Promise((resolve, reject) => {
    debug('Creating JWT using options', settings);

    jwt.sign(payload, secret, settings, (error, token) => {
      if (error) {
        debug('Error signing JWT', error);
        return reject(error);
      }

      debug('New JWT issued with payload', payload);
      return resolve(token);
    });
  });
}