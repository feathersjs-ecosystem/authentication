import fromRequest from './from-request';
import verifyToken from './verify-token';
import populateUser from './populate-user';

const middlewares = [ fromRequest, verifyToken, populateUser ];

Object.assign(middlewares, {
  fromRequest, verifyToken, populateUser
});

export default middlewares;
