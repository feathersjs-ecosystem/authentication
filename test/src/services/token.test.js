import { TokenService as token } from '../../../src';
// import feathers from 'feathers';
// import hooks from 'feathers-hooks';
// import rest from 'feathers-rest';
import { expect } from 'chai';

describe('service:token', () => {
  it('is CommonJS compatible', () => {
    expect(typeof require('../../../lib').TokenService).to.equal('function');
  });

  it('is ES6 compatible', () => {
    expect(typeof token).to.equal('function');
  });

  it('exposes the raw Service class', () => {
    expect(typeof token.Service).to.equal('function');
    expect(token.Service.name).to.equal('TokenService');
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
    //       service = app.service('auth/token');
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
    //         token: { usernameField: 'username' }
    //       }));

    //       const service = app.service('auth/token');
    //       expect(service.options.usernameField).to.equal('username');
    //     });

    //     it('allows overriding passwordField', () => {
    //       app.configure(authentication({
    //         token: { passwordField: 'pass' }
    //       }));

    //       const service = app.service('auth/token');
    //       expect(service.options.passwordField).to.equal('pass');
    //     });

    //     it('allows overriding common options on a service level', () => {
    //       app.configure(authentication({
    //         token: { userEndpoint: '/api/users' }
    //       }));

    //       const service = app.service('auth/token');
    //       expect(service.options.userEndpoint).to.equal('/api/users');
    //     });

    //     it('has common overrides', () => {
    //       app.configure(authentication({ usernameField: 'username' }));

    //       const service = app.service('auth/token');
    //       expect(service.options.usernameField).to.equal('username');
    //     });
    //   });
    // });
  });
});
