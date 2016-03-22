import assert from 'assert';
import hooks from '../../../src/hooks';

describe('Auth hooks', () => {
  it('is CommonJS compatible', () => {
    assert.equal(typeof require('../../../lib/hooks'), 'object');
  });

  it('is ES6 compatible', () => {
    assert.equal(typeof hooks, 'object');
  });

  it('exposes associateCurrentUser hook', () => {
    assert.equal(typeof hooks.associateCurrentUser, 'function');
  });

  it('exposes hashPassword hook', () => {
    assert.equal(typeof hooks.hashPassword, 'function');
  });

  it('exposes populateUser hook', () => {
    assert.equal(typeof hooks.populateUser, 'function');
  });

  it('exposes queryWithCurrentUser hook', () => {
    assert.equal(typeof hooks.queryWithCurrentUser, 'function');
  });

  it('exposes restrictToAuthenticated hook', () => {
    assert.equal(typeof hooks.restrictToAuthenticated, 'function');
  });

  it('exposes restrictToRoles hook', () => {
    assert.equal(typeof hooks.restrictToRoles, 'function');
  });

  it('exposes restrictToOwner hook', () => {
    assert.equal(typeof hooks.restrictToOwner, 'function');
  });

  it('exposes verifyToken hook', () => {
    assert.equal(typeof hooks.verifyToken, 'function');
  });
});