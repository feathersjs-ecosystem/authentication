import associateCurrentUser from './associate-current-user';
import hashPassword from './hash-password';
import populateUser from './populate-user';
import queryWithCurrentUser from './query-with-current-user';
import isAuthenticated from './is-authenticated';
import isPermitted from './is-permitted';
import verifyToken from './verify-token';
import checkPermissions from './check-permissions';

let hooks = {
  associateCurrentUser,
  hashPassword,
  populateUser,
  queryWithCurrentUser,
  isAuthenticated,
  isPermitted,
  verifyToken,
  checkPermissions
};

export default hooks;
