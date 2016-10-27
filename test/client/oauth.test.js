global.window = {
  open () {
    return {success: true};
  }
};

import { expect } from 'chai';
import {openLoginPopup, authAgent} from '../../src/client';
import {getCenterCoordinates} from '../../src/client/oauth';
import EventEmitter from 'events';

describe('OAuth Popup', () => {
  it(`opens new window`, () => {
    let authWindow = openLoginPopup('/auth/github');
    expect(authWindow).to.not.equal(undefined);
  });
});

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
