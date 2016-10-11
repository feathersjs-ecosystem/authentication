import Debug from 'debug';

const debug = Debug('feathers-authentication:token:verifyToken');

export default function() {
  return function verifyToken(data) {
    const token = typeof data === 'string' ? data : (data && data.token);
    const app = this;

    if(token) {
      debug('Verifying token', token);

      return app.authentication.verifyJWT(token)
        .then(result => Object.assign({ authenticated: true }, data, result));
    }

    return Promise.resolve(data);
  };
}
