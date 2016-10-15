import { expect } from 'chai';
import hooks from '../../../src/hooks';

describe('hooks', () => {
  it('is CommonJS compatible', () => {
    expect(typeof require('../../../lib/hooks')).to.equal('object');
  });

  it('is ES6 compatible', () => {
    expect(typeof hooks).to.equal('object');
  });

  it('exposes associateAuthenticated hook', () => {
    expect(typeof hooks.associateAuthenticated).to.equal('function');
  });

  it('exposes hashPassword hook', () => {
    expect(typeof hooks.hashPassword).to.equal('function');
  });

  it('exposes loadAuthenticated hook', () => {
    expect(typeof hooks.loadAuthenticated).to.equal('function');
  });

  it('exposes queryWithAuthenticated hook', () => {
    expect(typeof hooks.queryWithAuthenticated).to.equal('function');
  });

  it('exposes isAuthenticated hook', () => {
    expect(typeof hooks.isAuthenticated).to.equal('function');
  });

  it('exposes parseToken hook', () => {
    expect(typeof hooks.parseToken).to.equal('function');
  });
});
