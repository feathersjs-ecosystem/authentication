import associateCurrentUser from './associate-current-user';
import hashPassword from './hash-password';
import populateUser from './populate-user';
import queryWithCurrentUser from './query-with-current-user';
import isAuthenticated from './is-authenticated';
import restrictToOwner from './restrict-to-owner'; // deprecated
import restrictToRoles from './restrict-to-roles'; // deprecated
import verifyToken from './verify-token';
import verifyOrRestrict from './verify-or-restrict'; // deprecated
import populateOrRestrict from './populate-or-restrict'; // deprecated
import hasRoleOrRestrict from './has-role-or-restrict'; // deprecated
import hasPermissions from './has-permissions';

let hooks = {
  associateCurrentUser,
  hashPassword,
  populateUser,
  queryWithCurrentUser,
  isAuthenticated,
  restrictToAuthenticated: isAuthenticated, // deprecated
  restrictToOwner, // deprecated
  restrictToRoles, // deprecated
  verifyToken,
  verifyOrRestrict, // deprecated
  populateOrRestrict, // deprecated
  hasRoleOrRestrict, // deprecated
  hasPermissions
};

export default hooks;
