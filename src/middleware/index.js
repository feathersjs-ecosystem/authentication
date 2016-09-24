import { setupSocketIOAuthentication, setupPrimusAuthentication } from './sockets';
import exposeRequestResponse from './rest/expose-request-response';
import tokenParser from './rest/token-parser';
import decodeToken from './rest/decode-token';
import verifyToken from './rest/verify-token';
import populateUser from './rest/populate-user';
import setCookie from './rest/set-cookie';
import successfulLogin from './rest/login-success';
import notAuthenticated from './rest/not-authenticated';
import restrictToAuthenticated from './rest/restrict-to-authenticated';
import logout from './rest/logout';

export default {
  exposeRequestResponse,
  tokenParser,
  decodeToken,
  verifyToken,
  populateUser,
  setCookie,
  successfulLogin,
  notAuthenticated,
  restrictToAuthenticated,
  logout,
  setupSocketIOAuthentication,
  setupPrimusAuthentication
};
