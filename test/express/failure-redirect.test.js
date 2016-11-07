import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { failureRedirect } from '../../src/express';

chai.use(sinonChai);

describe('express:failureRedirect', () => {
  let req;
  let res;
  let next;
  let error;

  beforeEach(() => {
    req = {
      hook: {
        redirect: {
          url: '/app'
        }
      }
    };
    res = {
      redirect: sinon.spy()
    };
    next = sinon.spy();
    error = new Error('Authentication Error');
  });

  afterEach(() => {
    next.reset();
    res.redirect.reset();
  });

  describe('when redirect is set on the hook', () => {
    it('redirects to configured endpoint with default status code', () => {
      failureRedirect()(error, req, res, next);
      expect(res.redirect).to.have.been.calledOnce;
      expect(res.redirect).to.have.been.calledWith(302, '/app');
    });

    it('supports a custom status code', () => {
      req.hook.redirect.status = 400;
      failureRedirect()(error, req, res, next);
      expect(res.redirect).to.have.been.calledWith(400, '/app');
    });
  });

  describe('when req.hook is not defined', () => {
    it('calls next with error', () => {
      delete req.hook;
      failureRedirect()(error, req, res, next);
      expect(next).to.have.been.calledOnce;
      expect(next).to.have.been.calledWith(error);
    });
  });

  describe('when req.hook.redirect is not defined', () => {
    it('calls next with error', () => {
      delete req.hook.redirect;
      failureRedirect()(error, req, res, next);
      expect(next).to.have.been.calledOnce;
      expect(next).to.have.been.calledWith(error);
    });
  });
});