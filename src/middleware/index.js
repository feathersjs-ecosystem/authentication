import cookieParser from 'cookie-parser'; // external express middleware dependency
import { setupSocketIOAuthentication, setupPrimusAuthentication } from './sockets';
import exposeRequestResponse from './rest/expose-request-response';
import tokenParser from './rest/token-parser';
import verifyToken from './rest/verify-token';
import populateUser from './rest/populate-user';
import setCookie from './rest/set-cookie';
import successRedirect from './rest/success-redirect';
import notAuthenticated from './rest/not-authenticated';
import isAuthenticated from './rest/is-authenticated';
import isPermitted from './rest/is-permitted';
import checkPermissions from './rest/check-permissions';
import logout from './rest/logout';

export default {
  exposeRequestResponse,
  tokenParser,
  cookieParser,
  verifyToken,
  populateUser,
  setCookie,
  successRedirect,
  notAuthenticated,
  isAuthenticated,
  isPermitted,
  checkPermissions,
  logout,
  setupSocketIOAuthentication,
  setupPrimusAuthentication
};
