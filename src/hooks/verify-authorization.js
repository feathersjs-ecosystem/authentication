import Debug from 'debug';

const debug = Debug('feathers-authentication:hooks:verifyAuthorization');

export default function(options = {}) {
  return function verifyAuthorization(data) {
    // TODO
    return Promise.resolve(data);
  };
}
