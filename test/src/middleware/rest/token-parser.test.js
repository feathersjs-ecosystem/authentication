/*jshint expr: true*/

import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { tokenParser } from '../../../../src/middleware';

chai.use(sinonChai);

describe('middleware:rest:tokenParser', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      app: {},
      feathers: {},
      headers: {},
      cookies: {},
      body: {},
      query: {}
    };
    res = {};
    next = sinon.spy();
  });

  afterEach(() => {
    next.reset();
  });

  describe('when token passed via header', () => {
    it('parses the token', () => {
      req = Object.assign(req, {
        headers: {
          authorization: 'Bearer my-token'
        }
      });

      tokenParser()(req, res, next);
      expect(req.feathers.token).to.equal('my-token');
      expect(req.token).to.equal('my-token');
    });

    it('parses the token when "Bearer" is not present', () => {
      req = Object.assign(req, {
        headers: {
          authorization: 'my-token'
        }
      });

      tokenParser()(req, res, next);
      expect(req.feathers.token).to.equal('my-token');
      expect(req.token).to.equal('my-token');
    });

    it('supports a custom header', () => {
      req = Object.assign(req, {
        headers: {
          'x-authorization': 'Bearer my-token'
        }
      });

      tokenParser({ header: 'x-authorization' })(req, res, next);
      expect(req.feathers.token).to.equal('my-token');
      expect(req.token).to.equal('my-token');
    });

    it('capitalized headers', () => {
      req = Object.assign(req, {
        headers: {
          'authorization': 'Bearer my-token'
        }
      });

      tokenParser({ header: 'Authorization' })(req, res, next);
      expect(req.feathers.token).to.equal('my-token');
      expect(req.token).to.equal('my-token');
    });
  });

  describe('when token passed via cookie', () => {
    it('parses the token from an expected cookie', () => {
      req = Object.assign(req, {
        cookies: {
          'feathers-session': 'my-token'
        }
      });

      const options = {
        cookies: {
          enable: true,
          'feathers-session': {}
        }
      };

      tokenParser(options)(req, res, next);
      expect(req.feathers.token).to.equal('my-token');
      expect(req.token).to.equal('my-token');
    });

    it('does not parse the token from an unexpected cookie', () => {
      req = Object.assign(req, {
        cookies: {
          'feathers-fake': 'my-token'
        }
      });

      const options = {
        cookies: {
          enable: true,
          'feathers-session': {}
        }
      };

      tokenParser(options)(req, res, next);
      expect(req.feathers.token).to.equal(undefined);
      expect(req.token).to.equal(undefined);
    });
  });

  describe('when token passed via body', () => {
    it('grabs the token', () => {
      req = Object.assign(req, {
        body: {
          token: 'my-token'
        }
      });

      tokenParser()(req, res, next);
      expect(req.feathers.token).to.equal('my-token');
      expect(req.token).to.equal('my-token');
    });

    it('deletes the token from the body', () => {
      req = Object.assign(req, {
        body: {
          token: 'my-token'
        }
      });

      tokenParser()(req, res, next);
      expect(req.body.token).to.equal(undefined);
    });

    it('supports a custom token name', () => {
      req = Object.assign(req, {
        body: {
          custom: 'my-token'
        }
      });

      const options = {
        token: {
          name: 'custom'
        }
      };

      tokenParser(options)(req, res, next);
      expect(req.body.custom).to.equal(undefined);
      expect(req.token).to.equal(undefined);
      expect(req.feathers.custom).to.equal('my-token');
      expect(req.custom).to.equal('my-token');
    });
  });

  describe('when token passed via query and not in production', () => {
    it('grabs the token', () => {
      req = Object.assign(req, {
        query: {
          token: 'my-token'
        }
      });

      tokenParser()(req, res, next);
      expect(req.feathers.token).to.equal('my-token');
      expect(req.token).to.equal('my-token');
    });

    it('removes the token from the query string', () => {
      req = Object.assign(req, {
        query: {
          token: 'my-token'
        }
      });

      tokenParser()(req, res, next);
      expect(req.query.token).to.equal(undefined);
    });

    it('supports a custom token name', () => {
      req = Object.assign(req, {
        query: {
          custom: 'my-token'
        }
      });

      const options = {
        token: {
          name: 'custom'
        }
      };

      tokenParser(options)(req, res, next);
      expect(req.query.custom).to.equal(undefined);
      expect(req.token).to.equal(undefined);
      expect(req.feathers.custom).to.equal('my-token');
      expect(req.custom).to.equal('my-token');
    });
  });

  it('calls next', () => {
    tokenParser()(req, res, next);
    expect(next).to.have.been.calledOnce;
  });
});