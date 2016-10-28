import setCookie from './set-cookie';
import successRedirect from './success-redirect';
import failureRedirect from './failure-redirect';
import authenticate from './authenticate';
import isAuthenticated from './is-authenticated';
import getJWT from './get-jwt';
import exposeHeaders from './expose-headers';
import exposeCookies from './expose-cookies';
import events from './events';

export default {
  getJWT,
  exposeHeaders,
  exposeCookies,
  authenticate,
  isAuthenticated,
  setCookie,
  successRedirect,
  failureRedirect,
  events
};
