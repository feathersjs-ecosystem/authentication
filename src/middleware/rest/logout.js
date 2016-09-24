import omit from 'lodash.omit';
import Debug from 'debug';

const debug = Debug('feathers-authentication:middleware:logout');
const defaults = {
  cookies: {
    'feathers-session': true,
    'feathers-jwt': true
  }
};

export default function logout(options = {}) {
  debug('Registering logout middleware');

  return function(req, res, next) {
    options = Object.assign({}, defaults, options);
    debug('Running logout middleware with options:', options);

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

      if (req.app.locals) {
        delete req.app.locals.user;
      }
    };
    
    next();
  };
}