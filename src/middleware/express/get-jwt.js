import Debug from 'debug';

const debug = Debug('feathers-authentication:middleware:get-jwt');

export default function () {
  return function getJWT(req, res, next) {
    req.app.authentication.getJWT(req).then(result => {
      if(result && result.token) {
        const { token } = result;

        debug('Found token in request', token);
        req.token = token;

        if(req.feathers) {
          req.feathers.token = token;
        }
      }

      next();
    }).catch(next);
  };
}
