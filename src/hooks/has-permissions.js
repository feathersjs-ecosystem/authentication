import errors from 'feathers-errors';
// import isPlainObject from 'lodash.isplainobject';
// import intersection from 'lodash.intersection';
import Debug from 'debug';

const debug = Debug('feathers-authentication:hooks:has-permissions');

const defaults = {
  permissionsField: 'permissions',
  entity: 'user',
  idField: '_id'
};

// TODO (EK): Support multiple entities

// Permissions take the form of
// * - all services, all methods, all docs
// users:* - all methods on users service
// users:remove:* - can remove any user
// *:remove - can remove on any service
// users:remove:1234 - can only remove user with id 1234
// users:*:1234 - can call any service method for user with id 1234

export default function hasPermissions(name, options = {}){
  if (typeof name !== 'string') {
    return Promise.reject(new Error(`The 'hasPermissions' requires a name. It should be called like hasPermissions('users'[, options])`));
  }

  return function(hook) {
    if (hook.type !== 'before') {
      return Promise.reject(new Error(`The 'hasPermissions' hook should only be used as a 'before' hook.`));
    }

    // If it is an internal call then skip this hook
    if (!hook.params.provider) {
      return Promise.resolve(hook);
    }

    options = Object.assign({}, defaults, hook.app.get('auth'), options);

    let entity = hook.params[options.entity];

    if (!entity) {
      debug(`hook.params.${options.entity} is falsy. If you were expecting it to be defined check your hook order and your idField options in your auth config.`);
      // TODO (EK): Maybe we should just return a Forbidden error
      return Promise.reject(new errors.NotAuthenticated());
    }

    let authorized = false;
    let permissions = entity[options.permissionsField];

    // Normalize permissions. They can either be a
    // comma separated string or an array.
    // TODO (EK): May need to support joins on SQL tables
    if (typeof permissions === 'string') {
      permissions = permissions.split(',');
    }

    const id = entity[options.idField];
    const error = new errors.Forbidden('You do not have valid permissions to access this.');
    
    if (!permissions || !permissions.length) {
      debug(`'${options.permissionsField} is missing from '${options.entity}' or is empty.`);
      return Promise.reject(error);
    }

    if (id === undefined) {
      debug(`'${options.idField} is missing from '${options.entity}'.`);
      return Promise.reject(error);
    }

    // TODO (EK): Support checking the items we are querying for
    // and checking permissions on their ids
    const method = hook.method;
    const requiredPermissions = [
      '*',
      `${name}`,
      `${name}:*`,
      `*:${method}`,
      `${name}:${method}`,
      // `${name}:*:${id}`,
      // `${name}:${method}:${id}`
    ];

    console.log(`Required Permissions`, requiredPermissions);

    authorized = permissions.some(permission => requiredPermissions.includes(permission));

    console.log('authorized', authorized);

    if (!authorized) {
      return Promise.reject(error);
    }

    return Promise.resolve(hook);
  };
}