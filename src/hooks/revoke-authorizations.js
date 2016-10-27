import Debug from 'debug';

const debug = Debug('feathers-authentication:hooks:revokeAuthorizations');

export default function(options = {}) {
  return function revokeAuthorizations(data) {
    // TODO: revoke all pre-existing authorizations for the userId.
    return Promise.resolve(data);
  };
}
