/*jshint expr: true*/

import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { logout } from '../../../src/express';

chai.use(sinonChai);

describe('middleware:rest:logout', () => {
  let req, res, next, service;

  beforeEach(() => {
    service = {
      remove: sinon.spy()
    };

    req = {
      app: {
        service() {
          return service;
        }
      },
      token: 'testing',
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

  it('removes token from service if set', done => {
    logout({
      service: 'users'
    })(req, res, () => {
      req.logout();
      expect(service.remove).to.have.been.calledOnce;
      expect(service.remove).to.have.been.calledWith('testing');
      done();
    });
  });

  describe('when cookies are enabled', () => {
    it('clears cookies', done => {
      const options = {
        cookie: { enabled: true, name: 'feathers-jwt' }
      };

      logout(options)(req, res, () => {
        req.logout();
        expect(res.clearCookie).to.have.been.calledOnce;
        expect(res.clearCookie).to.have.been.calledWith('feathers-jwt');
        done();
      });
    });

    it('throws an error when no name is set', () => {
        const options = {
          cookie: { enabled: true }
        };

        try {
          logout(options);
          expect(false);
        } catch(e) {
          expect(e.message).to.equal(`'cookie.name' must be provided to logout() middleware in authentication options`);
        }
      });
  });
});
