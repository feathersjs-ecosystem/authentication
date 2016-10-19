import Debug from 'debug';

const debug = Debug('feathers-authentication:token:verifyToken');

export default function() {
  return function verifyToken(data) {
    if(data && data.token) {
      const app = this;
      const { token } = data;

      debug('Verifying token', token);

      return app.authentication.verifyJWT(token)
        .then(result => Object.assign({}, data, result));
    }

    return Promise.resolve(data);
  };
}
