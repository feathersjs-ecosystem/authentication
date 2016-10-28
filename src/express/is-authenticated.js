import Debug from 'debug';

const debug = Debug('feathers-authentication:express:authenticate');

export default function authenticate() {
  debug('Registering authenticate middleware');

  return function(req, res, next) {
    req.app.authentication.authenticate(req).then(result => {
      Object.assign(req, result);
      Object.assign(req.feathers, result);

      next();
    }).catch(next);
  };
}
