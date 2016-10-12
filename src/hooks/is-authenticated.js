import errors from 'feathers-errors';
// import Debug from 'debug';
// const debug = Debug('feathers-authentication:hooks:is-authenticated');

export default function isAuthenticated() {
  return function(hook) {
    if (hook.type !== 'before') {
      return Promise.reject(new Error(`The 'isAuthenticated' hook should only be used as a 'before' hook.`));
    }

    if (hook.params.provider && !hook.params.authenticated) {
      // TODO (EK): Add debug log to check to see if the user is populated, if the token was verified and warn appropriately
      return Promise.reject(new errors.NotAuthenticated('You are not authenticated.'));
    }

    return Promise.resolve(hook);
  };
}
