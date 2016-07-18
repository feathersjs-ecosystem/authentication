import Debug from 'debug';

const debug = Debug('feathers-authentication:login-success');

export default function loginSuccess(options = {}) {
  return function(req, res, next) {
    if (options.successRedirect !== undefined) {      
      return res.redirect(options.successRedirect);
    }
    
    next();
  }
}