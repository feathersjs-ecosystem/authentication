import authenticate from './authenticate';
import isAuthenticated from './is-authenticated';
import hashPassword from './hash-password';
import verifyToken from './verify-token';
import createAuthorization from './create-authorization';
import populateAuthorization from './populate-authorization';
import verifyAuthorization from './verify-authorization';
import revokeAuthorizations from './revoke-authorizations';
import populateEntity from './populate-entity';

export default {
  authenticate,
  isAuthenticated,
  hashPassword,
  verifyToken,
  createAuthorization,
  populateAuthorization,
  verifyAuthorization,
  revokeAuthorizations,
  populateEntity
};
