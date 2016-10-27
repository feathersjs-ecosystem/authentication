import Debug from 'debug';

const debug = Debug('feathers-authentication:hooks:createAuthorization');

export default function(options = {}) {
  return function createAuthorization(data) {
    // TODO
    return Promise.resolve(data);
  };
}
