import associateAuthenticated from './associate-authenticated';
import hashPassword from './hash-password';
import loadAuthenticated from './load-authenticated';
import queryWithAuthenticated from './query-with-authenticated';
import isAuthenticated from './is-authenticated';
import parseToken from './parse-token';

let hooks = {
  associateAuthenticated,
  hashPassword,
  loadAuthenticated,
  queryWithAuthenticated,
  isAuthenticated,
  parseToken
};

export default hooks;
