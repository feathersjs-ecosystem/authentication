import Debug from 'debug';

const debug = Debug('feathers-authentication:hooks:populateAuthorization');

export default function(options = {}) {
  return function populateAuthorization(data) {
    // TODO
    return Promise.resolve(data);
  };
}
