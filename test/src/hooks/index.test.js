import { expect } from 'chai';
import hooks from '../../../src/hooks';

describe('hooks', () => {
  it('is CommonJS compatible', () => {
    expect(typeof require('../../../lib/hooks')).to.equal('object');
  });

  it('is ES6 compatible', () => {
    expect(typeof hooks).to.equal('object');
  });

  it('exposes associateCurrentUser hook', () => {
    expect(typeof hooks.associateCurrentUser).to.equal('function');
  });

  it('exposes hashPassword hook', () => {
    expect(typeof hooks.hashPassword).to.equal('function');
  });

  it('exposes populateUser hook', () => {
    expect(typeof hooks.populateUser).to.equal('function');
  });

  it('exposes queryWithCurrentUser hook', () => {
    expect(typeof hooks.queryWithCurrentUser).to.equal('function');
  });

  it('exposes isAuthenticated hook', () => {
    expect(typeof hooks.isAuthenticated).to.equal('function');
  });

  it('exposes isPermitted hook', () => {
    expect(typeof hooks.isPermitted).to.equal('function');
  });

  it('exposes checkPermissions hook', () => {
    expect(typeof hooks.checkPermissions).to.equal('function');
  });

  it('exposes verifyToken hook', () => {
    expect(typeof hooks.verifyToken).to.equal('function');
  });
});
