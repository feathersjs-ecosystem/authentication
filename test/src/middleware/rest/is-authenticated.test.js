/*jshint expr: true*/

import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import errors from 'feathers-errors';
import { isAuthenticated } from '../../../../src/middleware';

chai.use(sinonChai);

describe('middleware:rest:isAuthenticated', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};
    res = {};
    next = sinon.spy();
  });

  afterEach(() => {
    next.reset();
  });

  describe('when not authenticated', () => {
    it('calls next with a new error', () => {
      isAuthenticated(req, res, next);
      expect(next).to.have.been.calledOnce;
      expect(next).to.have.been.calledWith(new errors.NotAuthenticated());
    });
  });

  describe('when authenticated', () => {
    before(() => req.authenticated = true);

    it('calls next', () => {
      isAuthenticated(req, res, next);
      expect(next).to.have.been.calledOnce;
    });
  });
});