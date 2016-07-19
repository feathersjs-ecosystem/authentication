import omit from 'lodash.omit';
import Debug from 'debug';

const debug = Debug('feathers-authentication:logout');
const defaults = {
  cookies: {
    'feathers-session': true,
    'feathers-jwt': true
  }
};

export default function logout(options = {}) {
  options = Object.assign({}, defaults, options);

  debug('Registering logout middleware with options:', options);
  
  return function(req, res, next) {
    req.logout = function() {
      debug('Logging out');

      const cookies = omit(options.cookies, 'enable');
      
      for (let key of Object.keys(cookies)) {
        const cookie = cookies[key];
        
        // If the cookie is not disabled clear it    
        if (cookie) {
          debug(`Clearing '${key}' cookie`);
          res.clearCookie(key);
        }
      }

      delete req.app.locals.user;
    };
    
    next();
  }
}