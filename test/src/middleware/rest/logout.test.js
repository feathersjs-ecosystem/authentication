/*jshint expr: true*/

import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { logout } from '../../../../src/middleware';

chai.use(sinonChai);

describe('middleware:rest:logout', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      app: {
        locals: {
          user: { id: 1 }
        }
      },
      feathers: {}
    };
    res = {
      clearCookie: sinon.spy()
    };
    next = sinon.spy();
  });

  afterEach(() => {
    next.reset();
  });

  it('binds a logout method to the request object', () => {
    logout()(req, res, next);
    expect(typeof req.logout).to.equal('function');
  });

  it('calls next', () => {
    logout()(req, res, next);
    expect(next).to.have.been.calledOnce;
  });

  it('clears cookies', done => {
    logout()(req, res, () => {
      req.logout();
      expect(res.clearCookie).to.have.been.calledTwice;
      expect(res.clearCookie).to.have.been.calledWith('feathers-oauth');
      expect(res.clearCookie).to.have.been.calledWith('feathers-session');
      done();
    });
  });

  describe('when app.locals exists', () => {
    it('removes the user from locals', done => {
      logout()(req, res, () => {
        req.logout();
        expect(req.app.locals.user).to.equal(undefined);
        done();
      });
    });
  });
});