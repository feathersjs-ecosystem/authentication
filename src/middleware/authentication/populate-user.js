import Debug from 'debug';

const debug = Debug('feathers-authentication:token:populate-user');


export default function(options) {
  const app = this;
  const { user } = options;

  if (!user.service) {
    throw new Error(`'user.service' needs to be set in authentication options`);
  }

  if (!user.payloadField) {
    throw new Error(`'user.payloadField' needs to be set in authentication options`);
  }

  return function populateUser(data) {
    const service = typeof user.service === 'string' ? app.service(user.service) : user.service;
    const { payloadField } = user;

    if (typeof service.get !== 'function') {
      throw new Error(`'user.service' does not support a 'get' method necessary for populateUser.`);
    }

    if (!data || !data.payload || data.payload[payloadField] === undefined) {
      return Promise.resolve(data);
    }

    const id = data.payload[payloadField];

    debug(`Populating user ${id}`);

    return service.get(id).then(result => {
      const user = result.toJSON ? result.toJSON() : result;

      return Object.assign({}, data, { user, authenticated: true });
    });
  };
}
