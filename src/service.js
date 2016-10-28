import Debug from 'debug';
import * as utils from './utils';
import { successRedirect, failureRedirect, setCookie, events } from './middleware/express';

const debug = Debug('feathers-authentication:authentication:service');

class Service {
  constructor(app) {
    this.app = app;
    // this.passport = app.passport;
  }

  create(data, params) {
    // if (params.provider && !params.authentication) {
    //   return Promise.reject(new Error(`External ${params.provider} requests need to run through an authentication provider`));
    // }
    const defaults = this.app.get('auth');

    // create accessToken
    // TODO (EK): Support refresh tokens
    // TODO (EK): This should likely be a hook
    return utils.createJWT(data.payload, params, defaults).then(accessToken => {
      this.emit('login', { accessToken });

      return { accessToken };
    });
  }

  remove(id, params) {
    const defaults = this.app.get('auth');
    const accessToken = id !== null ? id : params.accessToken;

    this.emit('logout', { accessToken });

    return utils.verifyJWT(accessToken, params, defaults);
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

    app.use(
      path,
      new Service(app, options),
      events(options),
      setCookie(options),
      successRedirect(),
      failureRedirect()
    );
  };
}

init.Service = Service;
