import jwt from 'jsonwebtoken';
import hooks from '../../hooks';
import errors from 'feathers-errors';

const TEN_HOURS = 36000;
const defaults = {
  tokenEndpoint: '/auth/token',
  expiresIn: TEN_HOURS,
};

export class Service {
  constructor(options = {}) {
    this.options = options;
  }

  // GET /auth/token
  // This is sort of a dummy route that we are using just to verify
  // that our token is correct by running our verifyToken hook. It
  // doesn't refresh our token it just returns our existing one with
  // our user data.
  find(params) {
    if (params.data && params.data.token) {
      const token = params.data.token;
      delete params.data.token;

      return Promise.resolve({
        token: token,
        data: params.data
      });
    }

    return Promise.reject(new errors.GeneralError('Something weird happened'));
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
    // Our before hook determined that we had a valid token or that this
    // was internally called so let's generate a new token and return it.
    const token = jwt.sign(params.data, this.options.secret, this.options);

    return Promise.resolve({
      token: token
    });
  }
}

export default function(options){
  options = Object.assign({}, defaults, options);
  console.log('configuring token auth service with options', options);

  return function() {
    const app = this;

    // Initialize our service with any options it requires
    app.use(options.tokenEndpoint, new Service(options));

    // Get our initialize service to that we can bind hooks
    const tokenService = app.service('/auth/token');

    // Set up our before hooks
    tokenService.before({
      // TODO (EK): Prevent external calls to create. Should be internal only
      create: [hooks.verifyToken(options.secret)],
      find: [hooks.verifyToken(options.secret)],
      get: [hooks.verifyToken(options.secret)]
    });

    // Set up our after hooks
    // tokenService.after(hooks.after);
  }
}
