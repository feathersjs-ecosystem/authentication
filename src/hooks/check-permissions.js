// import errors from 'feathers-errors';
// import isPlainObject from 'lodash.isplainobject';
// import intersection from 'lodash.intersection';
// import union from 'lodash.union';
// import flatten from 'lodash.flatten';
// import uniq from 'lodash.uniq';
import Debug from 'debug';

const debug = Debug('feathers-authentication:hooks:check-permissions');

const defaults = {
  permissionsField: 'permissions',
  entity: 'user'
};

// TODO (EK): Support multiple entities

// Permissions take the form of
// * - all services, all methods, all docs
// users:* - all methods on users service
// users:remove:* - can remove any user
// *:remove - can remove on any service
// users:remove:1234 - can only remove user with id 1234
// users:*:1234 - can call any service method for user with id 1234

export default function checkPermissions(name, options = {}){
  if (typeof name !== 'string') {
    throw new Error(`The 'checkPermissions' requires a name. It should be called like checkPermissions('users'[, options])`);
  }

  return function(hook) {
    if (hook.type !== 'before') {
      return Promise.reject(new Error(`The 'checkPermissions' hook should only be used as a 'before' hook.`));
    }

    // If it is an internal call then skip this hook
    if (!hook.params.provider) {
      return Promise.resolve(hook);
    }

    options = Object.assign({}, defaults, hook.app.get('auth'), options);

    let entity = hook.params[options.entity];

    if (!entity) {
      debug(`hook.params.${options.entity} does not exist. If you were expecting it to be defined check your hook order and your idField options in your auth config.`);
      return Promise.resolve(hook);
    }

    const id = hook.id;
    const method = hook.method;
    let permissions = entity[options.permissionsField] || [];

    // Normalize permissions. They can either be a
    // comma separated string or an array.
    // TODO (EK): May need to support joins on SQL tables
    if (typeof permissions === 'string') {
      permissions = permissions.split(',');
    }
    
    if (!permissions.length) {
      debug(`'${options.permissionsField} is missing from '${options.entity}' or is empty.`);
      return Promise.resolve(hook);
    }

    let requiredPermissions = [
      '*',
      `${name}`,
      `${name}:*`,
      `*:${method}`,
      `${name}:${method}`
    ];

    if (!!id || id === 0) {
      requiredPermissions = requiredPermissions.concat([
        `${name}:*:${id}`,
        `${name}:${method}:${id}`
      ]);
    }

    debug(`Required Permissions`, requiredPermissions);

    hook.params.permitted = permissions.some(permission => requiredPermissions.includes(permission));

    return Promise.resolve(hook);
  };
}