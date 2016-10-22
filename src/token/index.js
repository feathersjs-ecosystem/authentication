import verifyToken from './verify-token';
import populateUser from './populate-user';

const middlewares = [ verifyToken, populateUser ];

Object.assign(middlewares, {
  verifyToken, populateUser
});

export default middlewares;
