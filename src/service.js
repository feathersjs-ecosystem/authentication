import Debug from 'debug';
import merge from 'lodash.merge';
import { successRedirect, failureRedirect, setCookie, emitEvents } from './express';

const debug = Debug('feathers-authentication:authentication:service');

class Service {
  constructor(app) {
    this.app = app;
    this.passport = app.passport;
  }

  create(data, params) {
    const defaults = this.app.get('auth');

    // create accessToken
    // TODO (EK): Support refresh tokens
    // TODO (EK): This should likely be a hook
    // TODO (EK): This service can be datastore backed to support blacklists :)
    return this.passport
      .createJWT(data.payload, merge(defaults, params))
      .then(accessToken => {
        return { accessToken };
      });
  }

  remove(id, params) {
    const defaults = this.app.get('auth');
    const accessToken = id !== null ? id : params.headers[defaults.header.toLowerCase()];
    // TODO (EK): return error if token is missing?
    return this.passport
      .verifyJWT(accessToken, merge(defaults, params))
      .then(payload => {
        return { accessToken };
      });
  }
}

export default function init(options){
  return function() {
    const app = this;
    const path = options.path;

    if (typeof path !== 'string') {
      throw new Error(`You must provide a 'path' in your authentication configuration or pass one explicitly.`);
    }

    debug('Configuring authentication service at path', path);

    app.use(
      path,
      new Service(app, options),
      emitEvents(options),
      setCookie(options),
      successRedirect(),
      failureRedirect(options)
    );
  };
}

init.Service = Service;
