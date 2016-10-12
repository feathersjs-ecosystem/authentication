/*jshint expr: true*/

import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import errors from 'feathers-errors';
import { isPermitted } from '../../../../src/middleware';

chai.use(sinonChai);

describe('middleware:rest:isPermitted', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      feathers: {}
    };
    res = {};
    next = sinon.spy();
  });

  afterEach(() => {
    next.reset();
  });

  describe('when not permitted', () => {
    it('calls next with a new error', () => {
      isPermitted(req, res, next);
      expect(next).to.have.been.calledOnce;
      expect(next).to.have.been.calledWith(new errors.Forbidden('You do not have the correct permissions.'));
    });
  });

  describe('when req.permitted', () => {
    before(() => req.permitted = true);

    it('calls next', () => {
      isPermitted(req, res, next);
      expect(next).to.have.been.calledOnce;
    });
  });

  describe('when req.feathers.permitted', () => {
    before(() => req.permitted = true);

    it('calls next', () => {
      isPermitted(req, res, next);
      expect(next).to.have.been.calledOnce;
    });
  });
});