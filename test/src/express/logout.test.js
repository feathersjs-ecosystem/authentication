/*jshint expr: true*/

import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { logout } from '../../../src/express';

chai.use(sinonChai);

describe.skip('middleware:rest:logout', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      app: {
        locals: {
          user: { id: 1 }
        },
        get: () => {}
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

  describe('when cookies are enabled', () => {
    it('clears cookies', done => {
      const options = { enabled: true, name: 'feathers-jwt' };

      logout(options)(req, res, () => {
        req.logout();
        expect(res.clearCookie).to.have.been.calledOnce;
        expect(res.clearCookie).to.have.been.calledWith('feathers-jwt');
        done();
      });
    });

    describe('when cookie name is missing', () => {
      it('it throws an error', done => {
        const options = { enabled: true };

        logout(options)(req, res, () => {
          try {
            req.logout();
          }
          catch(error) {
            expect(error).to.not.equal(undefined);
            done();
          }
        });
      });
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
