import { expect } from 'chai';
import hooks from '../../src/hooks';

describe.only('hooks', () => {
  it('is CommonJS compatible', () => {
    expect(typeof require('../../lib/hooks')).to.equal('object');
  });

  it('is ES6 compatible', () => {
    expect(typeof hooks).to.equal('object');
  });

  it('exposes authenticate hook', () => {
    expect(typeof hooks.authenticate).to.equal('function');
  });

  it('exposes hashPassword hook', () => {
    expect(typeof hooks.hashPassword).to.equal('function');
  });

  it('exposes createAuthorization hook', () => {
    expect(typeof hooks.createAuthorization).to.equal('function');
  });

  it('exposes populateAuthorization hook', () => {
    expect(typeof hooks.populateAuthorization).to.equal('function');
  });

  it('exposes populatEntity hook', () => {
    expect(typeof hooks.populatEntity).to.equal('function');
  });

  it('exposes isAuthenticated hook', () => {
    expect(typeof hooks.isAuthenticated).to.equal('function');
  });

  it('exposes revokeAuthorizations hook', () => {
    expect(typeof hooks.revokeAuthorizations).to.equal('function');
  });

  it('exposes verifyAuthorization hook', () => {
    expect(typeof hooks.verifyAuthorization).to.equal('function');
  });

  it('exposes verifyToken hook', () => {
    expect(typeof hooks.verifyToken).to.equal('function');
  });
});