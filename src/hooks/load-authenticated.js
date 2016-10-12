/**
 * Load the authenticated entity associated with the JWT
 * into hook.params for future use. In most cases the User
 */
import merge from 'lodash.merge';
import Debug from 'debug';

const debug = Debug('feathers-authentication:hooks:load-authenticated');

export default function loadAuthenticated(options = {}){
  return function(hook) {
    const app = hook.app;
    const authOptions = app.get('auth');

    options = merge({}, authOptions, options);

    debug('Running loadAuthenticated hook with options:', options);

    if (options.user && !options.to) {
      options.to = 'user';
    }

    if (options.user && !options.service) {
      options.service = options.user.service;
    }

    if (options.user && !options.idField) {
      options.idField = options.user.idField;
    }

    if (!options.to) {
      return Promise.reject(new Error(`'to' must be provided to the loadAuthenticated() hook.`));
    }

    if (!options.idField) {
      return Promise.reject(new Error(`'idField' must be provided to the loadAuthenticated() hook.`));
    }

    if (!options.service) {
      return Promise.reject(new Error(`'service' must be provided to the loadAuthenticated() hook.`));
    }

    let to = options.to;
    let entity = hook.params[to];

    // If the entity already exists
    // no need to look them up again.
    if (entity) {

      // If it's an after hook attach the user to the response
      if (hook.result) {
        hook.result[to] = Object.assign({}, entity = entity.toJSON ? entity.toJSON() : entity);

        // remove the id field from the root, it already exists inside the user object
        delete hook.result[options.idField];
      }

      return Promise.resolve(hook);
    }

    let id;

    // If it's an after hook grab the id from the result
    if (hook.type === 'after') {
      id = hook.result[options.idField];
    }
    // Check to see if we have an id from a decoded JWT
    else if (hook.params.payload) {
      id = hook.params.payload[options.idField];
    }

    // If we didn't find an id then just pass through
    if (id === undefined) {
      return Promise.resolve(hook);
    }

    return hook.app.service(options.service).get(id, {}).then(entity => {
      // attach the authenticated entity to the hook for use in other hooks or services
      hook.params[to] = entity;

      // If it's an after hook attach the user to the response
      if (hook.result) {
        hook.result[to] = Object.assign({}, entity = entity.toJSON ? entity.toJSON() : entity);

        // remove the id field from the root, it already exists inside the user object
        delete hook.result[options.idField];
      }

      return Promise.resolve(hook);
    });
  };
}
