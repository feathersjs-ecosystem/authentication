/*jshint expr: true*/

import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import ms from 'ms';
import { setCookie } from '../../../../src/middleware';

chai.use(sinonChai);

describe('middleware:rest:setCookie', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      app: {
        get: () => {}
      },
      feathers: {}
    };
    res = {
      cookie: sinon.spy(),
      clearCookie: sinon.spy(),
      data: {
        token: 'token'
      }
    };
    next = sinon.spy();
  });

  afterEach(() => {
    res.cookie.reset();
    res.clearCookie.reset();
    next.reset();
  });

  describe('options', () => {
    beforeEach(() => {
      req.app.get = () => {
        return {
          cookie: {
            enabled: false,
            name: 'feathers-jwt',
            httpOnly: true,
            maxAge: '1d',
            secure: true
          }
        };
      };
    });

    it('pulls options from global config', () => {
      setCookie()(req, res, next);
      expect(next).to.have.been.calledOnce;
    });

    it('supports custom options', () => {
      setCookie({ enabled: true, name: 'custom-cookie' })(req, res, next);
      expect(res.cookie).to.have.been.calledWith('custom-cookie', 'token');
      expect(next).to.have.been.calledOnce;
    });
  });

  describe('when cookies are not enabled', () => {
    const options = {
      enabled: false
    };

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
    let options = {
      enabled: true,
      name: 'feathers-jwt',
      httpOnly: true,
      maxAge: '1d',
      secure: true
    };

    it('clears cookie', () => {
      setCookie(options)(req, res, next);
      expect(res.clearCookie).to.have.been.calledWith(options.name);
    });

    it('sets cookie with correct options', () => {
      setCookie(options)(req, res, next);
      expect(res.cookie).to.have.been.calledWith('feathers-jwt', 'token');
    });

    it('sets cookie with custom expiration', () => {
      const expiry = new Date(Date.now() + ms('1d'));
      options.expires = expiry;

      setCookie(options)(req, res, next);
      
      const expectedOptions = {
        httpOnly: true,
        secure: true,
        expires: expiry
      };

      expect(res.cookie).to.have.been.calledWithExactly('feathers-jwt', 'token', expectedOptions);
    });

    it('throws an error when expiration is not a date', () => {
      options.expires = null;

      try {
        setCookie(options)(req, res, next);
      }
      catch(error) {
        expect(error).to.not.equal(undefined);
      }
    });

    it('calls next', () => {
      setCookie(options)(req, res, next);
      expect(next).to.have.been.calledOnce;
    });
  });
});