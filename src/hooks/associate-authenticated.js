const defaults = {
  idField: '_id',
  as: 'userId',
  from: 'user'
};

import merge from 'lodash.merge';
import Debug from 'debug';

const debug = Debug('feathers-authentication:hooks:associate-authenticated');

export default function associateAuthenticated(options = {}){
  return function(hook) {
    if (hook.type !== 'before') {
      return Promise.reject(new Error(`The 'associateAuthenticated' hook should only be used as a 'before' hook.`));
    }

    const app = hook.app;
    const authOptions = app.get('auth') || {};

    options = merge({ user: {} }, authOptions, options);

    debug('Running associateAuthenticated hook with options:', options);
    
    if (!options.user.idField) {
      return Promise.reject(new Error(`'user.idField' must be provided to the associateAuthenticated() hook or set 'auth.user.idField' in your config.`));
    }

    if (!options.as) {
      return Promise.reject(new Error(`'as' must be provided to the associateAuthenticated() hook`));
    }

    if (!options.from) {
      return Promise.reject(new Error(`'from' must be provided to the associateAuthenticated() hook`));
    }

    const entity = hook.params[options.from];

    if (!entity) {
      if (!hook.params.provider) {
        return Promise.resolve(hook);
      }

      return Promise.reject(new Error(`There is no current '${options.from}' to associate.`));
    }

    options = Object.assign({}, defaults, hook.app.get('auth'), options);

    const id = entity[options.user.idField];

    if (id === undefined) {
      return Promise.reject(new Error(`Current '${options.from}' is missing '${options.user.idField}' field.`));
    }

    function setId(obj){
      obj[options.as] = id;
    }

    // Handle arrays.
    if (Array.isArray(hook.data)) {
      hook.data.forEach(setId);
    }
    // Handle single objects.
    else {
      setId(hook.data);
    }

    return Promise.resolve(hook);
  };
}