import authentication from '../../src';
import assert from 'assert';

describe('Feathers Authentication', () => {
  it('is CommonJS compatible', () => {
    assert.equal(typeof require('../../lib'), 'function');
  });

  it('is ES6 compatible', () => {
    assert.equal(typeof authentication, 'function');
  });

  it('exposes hooks', () => {
    assert.equal(typeof authentication.hooks, 'object');
  });
});