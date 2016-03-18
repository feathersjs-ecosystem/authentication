import associateCurrentUser from './associate-current-user';
import hashPassword from './hash-password';
import isAuthenticated from './is-authenticated';
import populateUser from './populate-user';
import queryWithCurrentUser from './query-with-current-user';
import restrictToSelf from './restrict-to-self';
import restrictToRoles from './restrict-to-roles';
import verifyToken from './verify-token';

let hooks = {
  associateCurrentUser,
  hashPassword,
  isAuthenticated,
  populateUser,
  queryWithCurrentUser,
  restrictToSelf,
  restrictToRoles,
  verifyToken
};

export default hooks;
