import fromRequest from './from-request';
import verifyToken from './verify-token';
import populateUser from './populate-user';

export default {
  fromRequest, verifyToken, populateUser
};

export const authMiddleware = [
  fromRequest, verifyToken, populateUser
];
