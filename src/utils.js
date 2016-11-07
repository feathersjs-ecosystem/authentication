import Debug from 'debug';
import jwt from 'jsonwebtoken';

const debug = Debug('feathers-authentication:authentication:utils');

export function createJWT (payload = {}, options = {}) {
  const settings = Object.assign({}, options.jwt);
  const { secret } = options;

  return new Promise((resolve, reject) => {
    debug('Creating JWT using options', settings);

    if (!secret) {
      return reject(new Error(`secret must provided`));
    }

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

export function verifyJWT (token, options = {}) {
  const settings = Object.assign({}, options.jwt);
  const { secret } = options;

  // normalize algorithm to array
  if (settings.algorithm) {
    settings.algorithms = Array.isArray(settings.algorithm) ? settings.algorithm : [settings.algorithm];
    delete settings.algorithm;
  }

  return new Promise((resolve, reject) => {
    debug('Verifying token', token);

    if (!secret) {
      return reject(new Error(`secret must provided`));
    }

    jwt.verify(token, secret, settings, (error, payload) => {
      if (error) {
        debug('Error verifying token', error);
        return reject(error);
      }

      debug('Verified token with payload', payload);
      resolve(payload);
    });
  });
}