import bcrypt from 'bcryptjs';

/**
 * Replaces a password located at the provided `passwordField` with a hash
 * of the password.
 * @param  {String} passwordField  The field containing the password.
 */
const defaults = { passwordField: 'password' };

export default function(options = {}){
  options = Object.assign({}, defaults, options);

  const crypto = options.bcrypt || bcrypt;

  return function(hook) {
    if (!hook.data || !hook.data[options.passwordField]) {
      return hook;
    }

    return new Promise(function(resolve, reject){
      crypto.genSalt(10, function(err, salt) {
        crypto.hash(hook.data[options.passwordField], salt, function(err, hash) {
          if (err) {
            return reject(err);
          }

          hook.data[options.passwordField] = hash;
          resolve(hook);
        });
      });
    });
  };
}
