import Debug from 'debug';

const debug = Debug('feathers-authentication:express:events');

export default function() {
  return function(req, res, next) {
    const method = res.hook && res.hook.method;

    let event = null;

    if (method === 'remove') {
      event = 'logout';
    } else if (method === 'create') {
      event = 'login';
    }

    if (res.data && res.data.token && event) {
      const { app } = req;

      app.authentication.authenticate(res.data)
        .then(result => {
          debug(`Sending '${event}' event for REST provider. Token is`, res.data.token);

          app.emit(event, result, {
            provider: 'rest',
            req,
            res
          });

          next();
        }).catch(next);
    } else {
      next();
    }
  };
}
