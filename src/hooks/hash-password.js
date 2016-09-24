import bcrypt from 'bcryptjs';
import Debug from 'debug';

const debug = Debug('feathers-authentication:hooks:hash-password');
const defaults = { passwordField: 'password' };

export default function hashPassword(options = {}) {
  return function (hook) {
    if (hook.type !== 'before') {
      return Promise.reject(new Error(`The 'hashPassword' hook should only be used as a 'before' hook.`));
    }

    options = Object.assign({}, defaults, hook.app.get('auth'), options);

    const crypto = options.bcrypt || bcrypt;

    if (hook.data === undefined) {
      return Promise.resolve(hook);
    }

    let data;
    
    // make sure we actually have password fields
    if (Array.isArray(hook.data)) {
      data = hook.data.filter(item => {
        return item.hasOwnProperty(options.passwordField);
      });
    }
    else if (hook.data[options.passwordField]){
      data = hook.data;
    }

    // If the data doesn't have a password field
    // then don't attempt to hash it.
    if (data === undefined || (Array.isArray(data) && !data.length)) {
      debug(`'${options.passwordField}' field is missing.`);
      return Promise.resolve(hook);
    }

    const hashPw = function(item) {
      const password = item[options.passwordField];

      return new Promise((resolve, reject) => {
        crypto.genSalt(10, function(error, salt) {
          if (error) {
            return reject(error);
          }

          crypto.hash(password, salt, function(error, hash) {
            if (error) {
              return reject(error);
            }

            item[options.passwordField] = hash;
            resolve(item);
          });
        });
      });
    };

    if (Array.isArray(data)) {
      debug(`Hashing passwords.`);

      return Promise.all(data.map(hashPw)).then(results => {
        hook.data = results;
        return Promise.resolve(hook);
      });
    }

    debug(`Hashing password.`);
    return hashPw(data).then(result => {
      hook.data = result;
      return Promise.resolve(hook);
    });
  };
}
