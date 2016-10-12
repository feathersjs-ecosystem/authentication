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
      app: {
        get: () => {}
      },
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

  describe('when header is missing', () => {
    it('returns an error', () => {
      tokenParser()(req, res, next);
      expect(next).to.have.been.calledWith(new Error(`'header' must be provided to tokenParser() middleware or reside in your global auth config.`));
    });
  });

  describe('when token name is missing', () => {
    it('returns an error', () => {
      const options = { header: 'authorization' };
      tokenParser(options)(req, res, next);
      expect(next).to.have.been.calledWith(new Error(`'token.name' must be provided to tokenParser() middleware or reside in your global auth config.`));
    });
  });

  describe('when cookies are enabled and cookie name is missing', () => {
    it('returns an error', () => {
      const options = {
        header: 'authorization',
        token: { name: 'token' },
        cookie: { enabled: true }
      };

      tokenParser(options)(req, res, next);
      expect(next).to.have.been.calledWith(new Error(`'header' must be provided to tokenParser() middleware or reside in your global auth config.`));
    });
  });

  describe('when required options are present', () => {
    beforeEach(() => {
      req.app.get = () => {
        return {
          header: 'authorization',
          token: {
            name: 'token'
          },
          cookie: {
            enabled: false,
            name: 'feathers-jwt'
          }
        };
      };
    });

    it('pulls options from global config', () => {
      req = Object.assign(req, {
        headers: {
          authorization: 'Bearer my-token'
        }
      });

      tokenParser()(req, res, next);
      expect(req.token).to.equal('my-token');
      expect(next).to.have.been.calledOnce;
    });

    it('supports custom options', () => {
      req = Object.assign(req, {
        headers: {
          authorization: 'Bearer my-token'
        }
      });

      const options = {
        token: { name: 'customToken' }
      };

      tokenParser(options)(req, res, next);
      expect(req.customToken).to.equal('my-token');
      expect(next).to.have.been.calledOnce;
    });

    describe('when token passed via header', () => {
      beforeEach(() => {
        req = Object.assign(req, {
          headers: {
            authorization: 'Bearer my-token'
          }
        });
      });

      it('parses the token', () => {
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

      it('supports capitalized headers', () => {
        tokenParser({ header: 'Authorization' })(req, res, next);
        expect(req.feathers.token).to.equal('my-token');
        expect(req.token).to.equal('my-token');
      });
    });

    describe('when token passed via cookie', () => {
      beforeEach(() => {
        req = Object.assign(req, {
          cookies: {
            'feathers-jwt': 'my-token'
          }
        });
      });

      it('parses the token from default expected cookie', () => {
        const options = {
          cookie: {
            enabled: true
          }
        };

        tokenParser(options)(req, res, next);
        expect(req.feathers.token).to.equal('my-token');
        expect(req.token).to.equal('my-token');
      });

      it('parses the token from a custom expected cookie', () => {
        req = Object.assign(req, {
          cookies: {
            'custom': 'my-token'
          }
        });

        const options = {
          cookie: {
            enabled: true,
            name: 'custom'
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
          cookie: {
            enabled: true
          }
        };

        tokenParser(options)(req, res, next);
        expect(req.feathers.token).to.equal(undefined);
        expect(req.token).to.equal(undefined);
      });
    });

    describe('when token passed via body', () => {
      beforeEach(() => {
        req = Object.assign(req, {
          body: {
            token: 'my-token'
          }
        });
      });

      it('grabs the token', () => {
        tokenParser()(req, res, next);
        expect(req.feathers.token).to.equal('my-token');
        expect(req.token).to.equal('my-token');
      });

      it('deletes the token from the body', () => {
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
      beforeEach(() => {
        req = Object.assign(req, {
          query: {
            token: 'my-token'
          }
        });
      });

      it('grabs the token', () => {
        tokenParser()(req, res, next);
        expect(req.feathers.token).to.equal('my-token');
        expect(req.token).to.equal('my-token');
      });

      it('removes the token from the query string', () => {
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
  });
});