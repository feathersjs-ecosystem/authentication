import { expect } from 'chai';
import mw from '../../../src/middleware';

describe('middleware', () => {
  it('is CommonJS compatible', () => {
    expect(typeof require('../../../lib/middleware')).to.equal('object');
  });

  it('is ES6 compatible', () => {
    expect(typeof mw).to.equal('object');
  });

  it('exposes verifyToken', () => {
    expect(typeof mw.verifyToken).to.equal('function');
  });

  it('exposes exposeRequestResponse', () => {
    expect(typeof mw.exposeRequestResponse).to.equal('function');
  });

  it('exposes populateUser', () => {
    expect(typeof mw.populateUser).to.equal('function');
  });

  it('exposes successRedirect', () => {
    expect(typeof mw.successRedirect).to.equal('function');
  });

  it('exposes logout', () => {
    expect(typeof mw.logout).to.equal('function');
  });

  it('exposes notAuthenticated', () => {
    expect(typeof mw.notAuthenticated).to.equal('function');
  });

  it('exposes isAuthenticated', () => {
    expect(typeof mw.isAuthenticated).to.equal('function');
  });

  it.skip('exposes hasPermissions', () => {
    expect(typeof mw.hasPermissions).to.equal('function');
  });

  it('exposes tokenParser', () => {
    expect(typeof mw.tokenParser).to.equal('function');
  });

  it('exposes setCookie', () => {
    expect(typeof mw.setCookie).to.equal('function');
  });

  it('exposes cookieParser', () => {
    expect(typeof mw.cookieParser).to.equal('function');
  });

  it('exposes setupSocketIOAuthentication', () => {
    expect(typeof mw.setupSocketIOAuthentication).to.equal('function');
  });

  it('exposes setupPrimusAuthentication', () => {
    expect(typeof mw.setupPrimusAuthentication).to.equal('function');
  });
});
