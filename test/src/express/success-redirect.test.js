/*jshint expr: true*/

import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { successRedirect } from '../../../src/express';

chai.use(sinonChai);

describe('middleware:rest:successRedirect', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      app: {}
    };
    res = {
      redirect: sinon.spy()
    };
    next = sinon.spy();
  });

  afterEach(() => {
    next.reset();
    res.redirect.reset();
  });

  describe('when successRedirect is passed as options', () => {
    it('redirects to configured endpoint', () => {
      successRedirect({ successRedirect: '/app' })(req, res, next);
      expect(res.redirect).to.have.been.calledOnce;
      expect(res.redirect).to.have.been.calledWith('/app');
    });
  });

  describe('when successRedirect is not defined', () => {
    it('calls next', () => {
      successRedirect()(req, res, next);
      expect(next).to.have.been.calledOnce;
    });
  });
});
