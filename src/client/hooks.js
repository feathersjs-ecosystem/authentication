export function populateParams() {
  return function(hook) {
    const app = hook.app;

    Object.assign(hook.params, {
      user: app.get('user'),
      token: app.get('token')
    });

    return Promise.resolve(hook);
  };
}

export function populateHeader(options = {}) {
  return function(hook) {
    if (hook.params.token) {
      hook.params.headers = Object.assign({}, {
        [options.header || 'authorization']: hook.params.token
      }, hook.params.headers);
    }

    return Promise.resolve(hook);
  };
}

// This is only used for sockets
export function attachTokenToQuery() {
  return function(hook) {
    const app = hook.app;

    // Attach the token to the query object so that the server
    // can pick it up and verify it and remove it from the query
    // object server side.
    Object.assign(hook.params.query, {$token: app.get('token') });

    return Promise.resolve(hook);
  };
}