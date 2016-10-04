import merge from 'lodash.merge';
import Debug from 'debug';

const debug = Debug('feathers-authentication:hooks:query-with-authenticated');

export default function queryWithAuthenticated(options = {}) {
  return function(hook) {
    if (hook.type !== 'before') {
      return Promise.reject(new Error(`The 'queryWithAuthenticated' hook should only be used as a 'before' hook.`));
    }

    const app = hook.app;
    const authOptions = app.get('auth') || {};

    options = merge({ user: {} }, authOptions, options);

    debug('Running queryWithAuthenticated hook with options:', options);

    if (!options.user.idField) {
      return Promise.reject(new Error(`'user.idField' must be provided to the queryWithAuthenticated() hook or set 'auth.user.idField' in your config.`));
    }

    if (!options.as) {
      return Promise.reject(new Error(`'as' must be provided to the queryWithAuthenticated() hook.`));
    }

    if (!options.from) {
      return Promise.reject(new Error(`'from' must be provided to the queryWithAuthenticated() hook.`));
    }

    const entity = hook.params[options.from];

    // If the entity we are looking to add to the query
    // is missing just move along.
    if (!entity) {
      if (!hook.params.provider) {
        debug('hook.params.provider does not exist. This was an internal call. Skipping queryWithAuthenticated hook');
        return Promise.resolve(hook);
      }

      return Promise.reject(new Error(`There is no current '${options.from}' to associate.`));
    }

    const id = entity[options.user.idField];

    if (id === undefined) {
      return Promise.reject(new Error(`Current '${options.from}' is missing '${options.user.idField}' field.`));
    }

    hook.params.query[options.as] = id;

    return Promise.resolve(hook);
  };
}
