/*jshint expr: true*/

import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { setCookie } from '../../../../src/middleware';

chai.use(sinonChai);

describe('middleware:rest:setCookie', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      app: {},
      feathers: {}
    };
    res = {
      cookie: sinon.spy(),
      clearCookie: sinon.spy()
    };
    next = sinon.spy();
  });

  afterEach(() => {
    next.reset();
  });

  describe('when cookies are not enabled', () => {
    it('calls next', () => {
      setCookie()(req, res, next);
      expect(next).to.have.been.calledOnce;
    });
  });

  describe('when cookies are enabled', () => {
    it.skip('clears cookies', () => {
      setCookie()(req, res, next);
    });

    it.skip('sets cookies', () => {
      setCookie()(req, res, next);
    });

    it.skip('sets an explicit expiration date', () => {
      setCookie()(req, res, next);
    });

    it.skip('removes maxAge', () => {
      setCookie()(req, res, next);
    });

    it('calls next', () => {
      setCookie()(req, res, next);
      expect(next).to.have.been.calledOnce;
    });
  });
});