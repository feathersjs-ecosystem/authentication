import associateAuthenticated from './associate-authenticated';
import hashPassword from './hash-password';
import loadAuthenticated from './load-authenticated';
import queryWithAuthenticated from './query-with-authenticated';
import isAuthenticated from './is-authenticated';
import isPermitted from './is-permitted';
import parseToken from './parse-token';
import checkPermissions from './check-permissions';

let hooks = {
  associateAuthenticated,
  hashPassword,
  loadAuthenticated,
  queryWithAuthenticated,
  isAuthenticated,
  isPermitted,
  parseToken,
  checkPermissions
};

export default hooks;
