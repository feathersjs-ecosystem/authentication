import Debug from 'debug';

const debug = Debug('feathers-authentication:logout');
const defaults = {
  cookie: {
    name: 'feathers-session',
    // name: 'feathers-jwt',
  }
}

export default function logout(options = {}) {
  options = Object.assign({}, defaults, options);

  debug('Setting up logout middleware with options:', options);
  
  return function(req, res, next) {
    req.logout = function() {
      
      debug('Logging out');

      res.clearCookie(options.cookie.name);
      delete req.app.locals.user;
    };
    
    next();
  }
}