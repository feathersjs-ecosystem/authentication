import jwt from 'jsonwebtoken';
import hooks from '../../hooks';
import errors from 'feathers-errors';

const defaults = {
  expiresIn: 36000, // seconds to expiration. Default is 10 hours.
};

export class Service {
  constructor(options = {}) {
    this.options = options;
  }

  find(params) {
    return this.get(null, params).then(token => {
      return [ token ];
    });
  }

  // GET /auth/token/refresh
  get(id, params) {
    // Our before hook determined that we had a valid token
    // so let's enerate a new token and return it.
    const token = jwt.sign(params.data, this.options.secret, this.options);

    return Promise.resolve({
      token: token
    });
  }

  create(data, params) {
    // Our before hook determined that we had a valid token
    // so let's enerate a new token and return it.
    const token = jwt.sign(params.data, this.options.secret, this.options);

    return Promise.resolve({
      token: token,
      data: params.data
    });
  }
}

export default function(options){
  console.log('configuring token auth service with options', options);

  return function() {
    const app = this;

    // Initialize our service with any options it requires
    app.use('/auth/token', new Service(options));

    // Get our initialize service to that we can bind hooks
    const tokenService = app.service('/auth/token');

    // Set up our before hooks
    tokenService.before({
      // TODO (EK): Prevent external calls to create. Should be internal only
      create: [hooks.verifyToken(options.secret)],
      get: [hooks.verifyToken(options.secret)]
    });

    // Set up our after hooks
    // tokenService.after(hooks.after);
  }
}
