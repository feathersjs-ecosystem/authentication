import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import ms from 'ms';
import getOptions from '../../src/options';
import { setCookie } from '../../src/express';

chai.use(sinonChai);

describe('express:setCookie', () => {
  let req;
  let res;
  let next;
  let options;

  beforeEach(() => {
    options = getOptions();
    req = {
      app: {},
      feathers: {}
    };
    res = {
      cookie: sinon.spy(),
      clearCookie: sinon.spy(),
      hook: { method: 'create' },
      data: {
        accessToken: 'token'
      }
    };
    next = sinon.spy();
  });

  afterEach(() => {
    res.cookie.reset();
    res.clearCookie.reset();
    next.reset();
  });

  describe('when cookies are not enabled', () => {
    it('calls next', () => {
      setCookie(options)(req, res, next);
      expect(next).to.have.been.calledOnce;
    });

    it('does not clear cookie', () => {
      setCookie(options)(req, res, next);
      expect(res.clearCookie).to.not.have.been.called;
    });

    it('does not set cookie', () => {
      setCookie(options)(req, res, next);
      expect(res.cookie).to.not.have.been.called;
    });
  });

  describe('when cookies are enabled', () => {
    beforeEach(() => {
      options.cookie.enabled = true;
    });

    describe('when cookie name is missing', () => {
      beforeEach(() => {
        delete options.cookie.name;
      });

      it('does not clear the cookie', () => {
        setCookie(options)(req, res, next);
        expect(res.clearCookie).to.not.have.been.called;
      });

      it('does not set the cookie', () => {
        setCookie(options)(req, res, next);
        expect(res.cookie).to.not.have.been.called;
      });

      it('calls next', () => {
        setCookie(options)(req, res, next);
        expect(next).to.have.been.calledOnce;
      });
    });

    it('clears cookie', () => {
      setCookie(options)(req, res, next);
      expect(res.clearCookie).to.have.been.calledWith(options.cookie.name);
    });

    it('sets cookie with default expiration of the configured jwt expiration', () => {
      const expiry = new Date(Date.now() + ms(options.jwt.expiresIn));
      setCookie(options)(req, res, next);

      expect(res.cookie).to.have.been.calledWith('feathers-jwt', 'token');
      expect(res.cookie.getCall(0).args[2].httpOnly).to.equal(false);
      expect(res.cookie.getCall(0).args[2].secure).to.equal(true);
      expect(res.cookie.getCall(0).args[2].expires.toString()).to.equal(expiry.toString());
    });

    it('sets cookie with expiration using maxAge', () => {
      const expiry = new Date(Date.now() + ms('1d'));
      options.cookie.maxAge = '1d';
      setCookie(options)(req, res, next);

      expect(res.cookie).to.have.been.calledWith('feathers-jwt', 'token');
      expect(res.cookie.getCall(0).args[2].httpOnly).to.equal(false);
      expect(res.cookie.getCall(0).args[2].secure).to.equal(true);
      expect(res.cookie.getCall(0).args[2].expires.toString()).to.equal(expiry.toString());
    });

    it('sets cookie with custom expiration', () => {
      const expiry = new Date(Date.now() + ms('1d'));
      const expectedOptions = {
        httpOnly: false,
        secure: true,
        expires: expiry
      };
      options.cookie.expires = expiry;

      setCookie(options)(req, res, next);
      expect(res.cookie).to.have.been.calledWithExactly('feathers-jwt', 'token', expectedOptions);
    });

    it('returns an error when expiration is not a date', () => {
      options.cookie.expires = true;
      setCookie(options)(req, res, error => {
        expect(error).to.not.equal(undefined);
      });
    });

    it('calls next', () => {
      setCookie(options)(req, res, next);
      expect(next).to.have.been.calledOnce;
    });

    describe('when hook method is remove', () => {
      beforeEach(() => {
        res.hook.method = 'remove';
      });

      it('does not set the cookie', () => {
        setCookie(options)(req, res, next);
        expect(res.cookie).to.not.have.been.called;
      });

      it('calls next', () => {
        setCookie(options)(req, res, next);
        expect(next).to.have.been.calledOnce;
      });
    });
  });
});