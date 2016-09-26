import { OAuth2Service as oauth2 } from '../../../src';
// import feathers from 'feathers';
// import hooks from 'feathers-hooks';
// import rest from 'feathers-rest';
import { expect } from 'chai';

describe('service:oauth2', () => {
  it('is CommonJS compatible', () => {
    expect(typeof require('../../../lib')).to.equal('function');
  });

  it('is ES6 compatible', () => {
    expect(typeof oauth2).to.equal('function');
  });

  it('exposes the raw Service class', () => {
    expect(typeof oauth2.Service).to.equal('function');
    expect(oauth2.Service.name).to.equal('OAuth2Service');
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
    //       service = app.service('auth/oauth2');
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
    //         oauth2: { usernameField: 'username' }
    //       }));

    //       const service = app.service('auth/oauth2');
    //       expect(service.options.usernameField).to.equal('username');
    //     });

    //     it('allows overriding passwordField', () => {
    //       app.configure(authentication({
    //         oauth2: { passwordField: 'pass' }
    //       }));

    //       const service = app.service('auth/oauth2');
    //       expect(service.options.passwordField).to.equal('pass');
    //     });

    //     it('allows overriding common options on a service level', () => {
    //       app.configure(authentication({
    //         oauth2: { userEndpoint: '/api/users' }
    //       }));

    //       const service = app.service('auth/oauth2');
    //       expect(service.options.userEndpoint).to.equal('/api/users');
    //     });

    //     it('has common overrides', () => {
    //       app.configure(authentication({ usernameField: 'username' }));

    //       const service = app.service('auth/oauth2');
    //       expect(service.options.usernameField).to.equal('username');
    //     });
    //   });
    // });
  });
});
