import authentication from '../../src';
import { expect } from 'chai';

describe('Feathers Authentication', () => {
  it('is CommonJS compatible', () => {
    expect(typeof require('../../lib')).to.equal('function');
  });

  it('is ES6 compatible', () => {
    expect(typeof authentication).to.equal('function');
  });

  it('exposes hooks', () => {
    expect(typeof authentication.hooks).to.equal('object');
  });

  describe.skip('config options', () => {

    it('sets up default token', () => {

    });

  });
});