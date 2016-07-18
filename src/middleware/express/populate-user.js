import errors from 'feathers-errors';

const defaults = {
  endpoint: 'users',
  idField: '_id'
};

module.exports = function(options = {}) {
  options = Object.assign({}, defaults, options);

  return function(req, res, next) {
    const app = req.app;
    const id = (req.payload && req.payload[options.idField]) ? req.payload[options.idField] : undefined;
    
    // If we don't have an id to look up a
    // user by then move along.
    if (id === undefined) {
      return next();
    }

    app.service(options.endpoint).get(id).then(result => {
      const user = result.toJSON ? result.toJSON() : result;

      req.user = user;
      req.feathers.user = user;

      next();
    })
    .catch(next);
  }
};