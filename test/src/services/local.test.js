import { LocalService as local } from '../../../src';
// import feathers from 'feathers';
// import hooks from 'feathers-hooks';
// import rest from 'feathers-rest';
import { expect } from 'chai';

describe('service:local', () => {
  it('is CommonJS compatible', () => {
    expect(typeof require('../../../lib').LocalService).to.equal('function');
  });

  it('is ES6 compatible', () => {
    expect(typeof local).to.equal('function');
  });

  it('exposes the raw Service class', () => {
    expect(typeof local.Service).to.equal('function');
    expect(local.Service.name).to.equal('LocalService');
  });

  describe('config options', () => {
    // describe('default options', () => {
    //   let app;

    //   beforeEach(() => {
    //     app = feathers()
    //       .configure(rest())
    //       .configure(hooks())
    //       .configure(authentication({
    //         facebook: {
    //           strategy: Strategy,
    //           clientID: 'client',
    //           clientSecret: 'secret'
    //         }
    //       }));
    //   });

    //   describe('default options', () => {
    //     let service;

    //     beforeEach(() => {
    //       service = app.service('auth/local');
    //     });

    //     it('gets configured', () => {
    //       expect(service).to.not.equal(undefined);
    //       expect(typeof service.options).to.equal('object');
    //     });

    //     it('sets usernameField', () => {
    //       expect(service.options.usernameField).to.equal('email');
    //     });

    //     it('sets passwordField', () => {
    //       expect(service.options.passwordField).to.equal('password');
    //     });

    //     it('has the common options', () => {
    //       expect(service.options.tokenEndpoint).to.equal('/auth/token');
    //       expect(service.options.userEndpoint).to.equal('/users');
    //     });
    //   });

    //   describe('custom options', () => {
    //     let app;

    //     beforeEach(() => {
    //       app = feathers()
    //         .configure(rest())
    //         .configure(hooks());
    //     });

    //     it('allows overriding usernameField', () => {
    //       app.configure(authentication({
    //         local: { usernameField: 'username' }
    //       }));

    //       const service = app.service('auth/local');
    //       expect(service.options.usernameField).to.equal('username');
    //     });

    //     it('allows overriding passwordField', () => {
    //       app.configure(authentication({
    //         local: { passwordField: 'pass' }
    //       }));

    //       const service = app.service('auth/local');
    //       expect(service.options.passwordField).to.equal('pass');
    //     });

    //     it('allows overriding common options on a service level', () => {
    //       app.configure(authentication({
    //         local: { userEndpoint: '/api/users' }
    //       }));

    //       const service = app.service('auth/local');
    //       expect(service.options.userEndpoint).to.equal('/api/users');
    //     });

    //     it('has common overrides', () => {
    //       app.configure(authentication({ usernameField: 'username' }));

    //       const service = app.service('auth/local');
    //       expect(service.options.usernameField).to.equal('username');
    //     });
    //   });
    // });
  });

  describe('getFirstUser', () => {

  });

  describe('verify', () => {

  });

  describe('comparePassword', () => {

  });
});
