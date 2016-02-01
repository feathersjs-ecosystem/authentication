import jwt from 'jsonwebtoken';
import errors from 'feathers-errors';

/**
 * Verifies that a JWT token is valid
 * @param  {String} secret - The JWT secret
 */
export default function(secret){
  return function(hook) {
    return new Promise(function(resolve, reject){
      if (hook.params.internal) {
        hook.params.data = hook.data;
        return resolve(hook);
      }

      const token = hook.data ? hook.data.token : hook.params.query.token;

      jwt.verify(token, secret, function (error, data) {
        if (error) {
          // Return a 401 if the token has expired.
          return reject(new errors.NotAuthenticated(error));
        }
        

        hook.params.data = Object.assign({ token }, data);
        delete hook.params.data.iat;

        resolve(hook);
      });
    });
  };
}
