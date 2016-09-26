/*jshint expr: true*/

import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import errors from 'feathers-errors';
import { populateUser } from '../../../../src/middleware';

chai.use(sinonChai);

describe('middleware:rest:populateUser', () => {
  let req;
  let res;
  let next;
  let user = {
    _id: 1,
    email: 'admin@feathersjs.com'
  };

  beforeEach(() => {
    req = {
      app: {
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

  describe('when app.locals exists', () => {
    it('removes the user from locals', () => {
      req.app.locals = { user };

      populateUser()(req, res, next);
      expect(req.app.locals.user).to.equal(undefined);
    });
  });

  describe('when id does not exist', () => {
    it('calls next', () => {
      populateUser()(req, res, next);
      expect(next).to.have.been.calledOnce;
    });
  });

  describe('when user exists', () => {
    beforeEach(() => {
      req.payload = { _id: 1 };

      req.app.service = () => {
        return {
          get: () => {
            return Promise.resolve(user);
          }
        };
      };
    });

    it('sets the user on the request object', done => {
      populateUser()(req, res, () => {
        expect(req.feathers.user).to.deep.equal(user);
        expect(req.user).to.deep.equal(user);
        done();
      });
    });

    it('sets the user on app.locals', done => {
      req.app.locals = {};

      populateUser()(req, res, () => {
        expect(req.app.locals.user).to.deep.equal(user);
        done();
      });
    });
  });

  describe('when user does not exist', () => {
    beforeEach(() => {
      req.payload = { _id: 1 };

      req.app.service = () => {
        return {
          get: () => {
            return Promise.reject(new errors.NotFound());
          }
        };
      };
    });

    it('clears cookies', done => {
      populateUser()(req, res, () => {
        expect(res.clearCookie).to.have.been.calledTwice;
        expect(res.clearCookie).to.have.been.calledWith('feathers-oauth');
        expect(res.clearCookie).to.have.been.calledWith('feathers-session');
        done();
      });
    });

    it('calls next', done => {
      populateUser()(req, res, done);
    });
  });

  describe('when call to fetch user errors', () => {
    beforeEach(() => {
      req.payload = { _id: 1 };

      req.app.service = () => {
        return {
          get: () => {
            return Promise.reject(new errors.GeneralError());
          }
        };
      };
    });

    it('calls next with error', done => {
      populateUser()(req, res, error => {
        expect(error).to.not.equal(undefined);
        done();
      });
    });
  });
});