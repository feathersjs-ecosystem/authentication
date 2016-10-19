import Debug from 'debug';

const debug = Debug('feathers-authentication:middleware:set-cookie');

export default function () {
  return function getJWT(req, res, next) {
    req.app.authentication.getJWT(req).then(result => {
      if(result) {
        const { token } = result;

        debug('Found token in request', token);
        req.token = token;
        req.feathers.token = token;
      }

      next();
    }).catch(next);
  };
}
