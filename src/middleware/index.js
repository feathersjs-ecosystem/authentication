import { setupSocketIOAuthentication, setupPrimusAuthentication } from './sockets';
import exposeRequestResponse from './express/expose-request-response';
import tokenParser from './express/token-parser';
import decodeToken from './express/decode-token';
import populateUser from './express/populate-user';
import setCookie from './express/set-cookie';
import successfulLogin from './express/login-success';
import notAuthenticated from './express/not-authenticated';
import restrictToAuthenticated from './express/restrict-to-authenticated';
import logout from './express/logout';

export default {
  exposeRequestResponse,
  tokenParser,
  decodeToken,
  populateUser,
  setCookie,
  successfulLogin,
  notAuthenticated,
  restrictToAuthenticated,
  logout,
  setupSocketIOAuthentication,
  setupPrimusAuthentication
};
