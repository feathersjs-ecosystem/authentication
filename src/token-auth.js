import omit from 'lodash.omit';

export function tokenAuthHook(hook) {
  const { data } = hook;

  if (data.jwt) {
    return hook.app.authentication
      .verifyJWT(data.jwt)
      .then(result => {
        const tokenPayload = omit(result.payload, 'iss', 'sub', 'exp');

        hook.params.authentication = 'jwt';

        // Make sure that existing token payload can not get overwritten
        hook.data.payload = Object.assign({}, hook.data.payload, tokenPayload);

        return hook;
      });
  }

  return Promise.resolve(hook);
}

export default function(options) {
  return function() {
    const service = this.service(options.service);

    if(!service) {
      throw new Error(`Authentication service '${options.service}' does not exist`);
    }

    if (typeof service.before === 'function') {
      service.before({
        create: tokenAuthHook
      });
    }
  };
}
