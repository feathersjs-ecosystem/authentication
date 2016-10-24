import Debug from 'debug';
import { successRedirect, setCookie, events } from './middleware/express';

const debug = Debug('feathers-authentication:authentication:service');

class Service {
  constructor(app) {
    this.authentication = app.authentication;
  }

  create(data, params) {
    if (params.provider && !params.authentication) {
      return Promise.reject(new Error(`External ${params.provider} requests need to run through an authentication provider`));
    }

    return this.authentication.createJWT(data.payload || {}).then(result => {
      this.emit('login', result);

      return result;
    });
  }

  remove(id, params) {
    const token = id !== null ? id : params.token;

    this.emit('logout', { token });

    return this.authentication.verifyJWT({ token });
  }
}

export default function init(options){
  return function() {
    const app = this;
    const path = options.service;

    if (typeof path !== 'string') {
      throw new Error(`Authentication option for 'service' needs to be set`);
    }

    debug('Configuring authentication service at path', path);

    app.use(path, new Service(app, options),
      events(options), setCookie(options), successRedirect(options)
    );
  };
}

init.Service = Service;
