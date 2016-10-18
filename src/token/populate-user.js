import Debug from 'debug';

const debug = Debug('feathers-authentication:token:populate-user');

export default function(options) {
  const app = this;
  const { user } = options;

  if(!user.service) {
    throw new Error(`'user.service' needs to be set in authentication options`);
  }

  return function populateUser(data) {
    const service = typeof user.service === 'string' ? app.service(user.service) : user.service;
    const idField = user.idField || service.id;

    if(typeof idField !== 'string') {
      throw new Error(`'user.idField' needs to be set in authentication options or the '${user.service}' service needs to provide an 'id' property.`);
    }

    if(typeof service.get !== 'function') {
      throw new Error(`'user.service' does not support a 'get' method necessary for populateUser.`);
    }

    if(!data || !data.payload || data.payload[idField] === undefined) {
      return Promise.resolve(data);
    }

    const id = data.payload[idField];

    debug(`Populating user ${id}`);

    return service.get(id).then(result => {
      const user = result.toJSON ? result.toJSON() : result;

      return Object.assign({ authenticated: true }, data, { user });
    });
  };
}
