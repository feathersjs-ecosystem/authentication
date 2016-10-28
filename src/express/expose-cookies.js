import Debug from 'debug';
const debug = Debug('feathers-authentication:express:expose-cookies');

export default function () {
  return function exposeHeaders(req, res, next) {
    debug('Exposing Express cookies to hooks and services');
    req.feathers.cookies = req.cookies;
    next();
  };
}
