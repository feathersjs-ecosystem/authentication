import { expect } from 'chai';
import {authAgent} from '../../src/client';
import {getCenterCoordinates} from '../../src/client/oauth';
import EventEmitter from 'events';

describe('authAgent EventEmitter', () => {
  it(`sets up an eventEmitter at window.authAgent`, () => {
    expect(authAgent instanceof EventEmitter).to.equal(true);
  });
});

describe('getCenterCoordinates', () => {
  it(`function exists`, () => {
    expect(typeof getCenterCoordinates).to.equal('function');
  });
});
