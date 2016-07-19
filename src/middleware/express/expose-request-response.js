import Debug from 'debug';

const debug = Debug('feathers-authentication:expose-request-response');

// Usually this is a big no no but passport requires the
// request object to inspect req.body and req.query so we
// need to miss behave a bit. Don't do this in your own code!
export default function exposeRequestResponse() {
  debug('Registering exposeRequestResponse middleware');

  return function(req, res, next) {
    debug('Exposing request and response objects to Feathers');
    req.feathers = req.feathers || {};
    req.feathers.req = req;
    req.feathers.res = res;
    next();
  };
}
