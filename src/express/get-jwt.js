import Debug from 'debug';
import { getJWT } from '../utils';

const debug = Debug('feathers-authentication:express:get-jwt');

export default function () {
  return function getJWT(req, res, next) {
    debug('Fetching token from request');
    getJWT(req).then(result => {
      if (result && result.token) {
        const { token } = result;

        debug('Found token in request', token);
        req.token = token;

        if (req.feathers) {
          req.feathers.token = token;
        }
      }

      next();
    }).catch(next);
  };
}
