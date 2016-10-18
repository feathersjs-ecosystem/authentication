import omit from 'lodash.omit';

export function tokenAuthHook(hook) {
  const { data } = hook;

  if(data.token) {
    return hook.app.authentication
      .verifyJWT(data.token)
      .then(result => {
        const payload = omit(result.payload, 'iss', 'sub', 'exp');

        // Make sure that existing token payload can not get overwritten
        hook.data.payload = Object.assign({}, hook.data.payload, payload);
      });
  }

  return Promise.resolve(hook);
}

export default function(options) {
  return function() {
    const service = this.service(options.service);

    if(!service) {
      throw new Error(`Authentication service '${options.service} does not exist`);
    }

    if(!service.before) {
      throw new Error(`Authentication service '${options.service} does not have a '.before' method. Did you configure 'feathers-hooks' before authentication?`);
    }

    service.before({
      create: tokenAuthHook
    });
  };
}
