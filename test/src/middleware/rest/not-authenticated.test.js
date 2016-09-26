/*jshint expr: true*/

import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import errors from 'feathers-errors';
import { notAuthenticated } from '../../../../src/middleware';

chai.use(sinonChai);

describe('middleware:rest:notAuthenticated', () => {
  let req;
  let res;
  let next;
  let error;

  beforeEach(() => {
    req = {};
    res = {
      redirect: sinon.spy()
    };
    next = sinon.spy();
    error = new errors.NotAuthenticated();
  });

  afterEach(() => {
    next.reset();
    res.redirect.reset();
  });

  describe('when failureRedirect is defined and unauthorized error', () => {
    it('redirects to configured endpoint', () => {
      notAuthenticated({ failureRedirect: '/login' })(error, req, res, next);
      expect(res.redirect).to.have.been.calledOnce;
      expect(res.redirect).to.have.been.calledWith('/login');
    });
  });

  describe('when notAuthenticated is defined', () => {
    it('calls next', () => {
      notAuthenticated()(error, req, res, next);
      expect(next).to.have.been.calledOnce;
    });
  });
});