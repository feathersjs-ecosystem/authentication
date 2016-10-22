export default function() {
  return function authenticate(hook) {
    if (hook.type !== 'before') {
      return Promise.reject(new Error(`The 'authenticate' hook should only be used as a 'before' hook.`));
    }

    const { token } = hook.params;

    if (token) {
      return hook.app.authenticate(hook.params).then(result => {
        hook.params = Object.assign({}, hook.params, result);
        return hook;
      });
    }

    return Promise.resolve(hook);
  };
}
