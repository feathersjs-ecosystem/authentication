import errors from 'feathers-errors';
// import Debug from 'debug';
// const debug = Debug('feathers-authentication:hooks:is-permitted');

export default function isPermitted() {
  return function(hook) {
    if (hook.type !== 'before') {
      return Promise.reject(new Error(`The 'isPermitted' hook should only be used as a 'before' hook.`));
    }

    if (hook.params.provider && !hook.params.permitted) {
      return Promise.reject(new errors.Forbidden('You do not have the correct permissions.'));
    }

    return Promise.resolve(hook);
  };
}
