import { expect } from 'chai';
import Authentication from '../../src/authentication/base';
import getOptions from '../../src/options';

function timeout(callback, timeout) {
  return new Promise(resolve =>
    setTimeout(() => resolve(callback()), timeout)
  );
}

describe('Feathers Authentication Base Class', () => {
  const original = { name: 'Feathers' };
  const app = {};
  const options = getOptions({
    secret: 'supersecret',
    header: 'Authorization'
  });
  const auth = new Authentication(app, options);

  auth.use(function() {
    return function(data) {
      expect(this).to.equal(app);
      expect(data).to.deep.equal(original);
      data.firstRan = true;

      return data;
    };
  });

  it('initially has default middleware .use replaces it', () => {
    const a = new Authentication(app, options);

    expect(a._middleware.isInitial).to.be.ok;

    a.use(function() {});
    expect(a._middleware.isInitial).to.not.be.ok;
    expect(a._middleware.length).to.equal(1);
  });

  it('.authenticate runs middleware', () => {
    expect(auth.use(function(opts) {
      expect(opts).to.deep.equal(options);

      return function(data) {
        expect(data).to.deep
          .equal(Object.assign({ firstRan: true }, original));

        return new Promise(resolve =>
          setTimeout(() => resolve(Object.assign({
            secondRan: true
          }, data)), 100)
        );
      };
    })).to.equal(auth);

    return auth.authenticate(original).then(result =>
      expect(result).to.deep.equal({
        secondRan: true,
        name: 'Feathers',
        firstRan: true
      })
    );
  });

  describe('getJWT', () => {
    it('gets token from string', () => {
      const token = 'testing';

      return auth.getJWT(token).then(data => {
        expect(data).to.deep.equal({ token });
      });
    });

    it('gets token from object', () => {
      const token = 'othertest';
      const data = { token, original: true };

      return auth.getJWT(data).then(result => {
        expect(result).to.deep.equal({ token });
      });
    });

    it('passes undefined for non token data', () => {
      return auth.getJWT({}).then(result => {
        expect(result).to.equal(undefined);
      });
    });

    describe('from request like object', () => {
      it('parses basic authorization header', () => {
        const mockRequest = {
          headers: {
            authorization: 'sometoken'
          }
        };

        return auth.getJWT(mockRequest).then(data => {
          expect(data.req).to.equal(mockRequest);
          expect(data.token).to.equal('sometoken');
        });
      });

      it('parses `Bearer` authorization header', () => {
        const mockRequest = {
          headers: {
            authorization: 'BeaRer sometoken'
          }
        };

        return auth.getJWT(mockRequest).then(data => {
          expect(data.req).to.equal(mockRequest);
          expect(data.token).to.equal('sometoken');
        });
      });
    });
  });

  describe('createJWT and verifyJWT', () => {
    it('basics', () => {
      return auth.createJWT({
        name: 'Eric'
      }).then(data =>
        auth.verifyJWT(data).then(result => {
          const { payload } = result;
          expect(payload.name).to.equal('Eric');
          expect(payload.exp);
          expect(payload.iss).to.equal('feathers');
        })
      );
    });

    it('createJWT errors with wrong options', () => {
      return auth.createJWT({
        name: 'Eric'
      }, {
        algorithm: 'blaalgo'
      }).catch(e => {
        expect(e.message).to.equal(`child "algorithm" fails because ["algorithm" must be one of [RS256, RS384, RS512, ES256, ES384, ES512, HS256, HS384, HS512, none]]`);
      });
    });

    it('verify errors with malformed token', () => {
      auth.verifyJWT('invalid token').catch(e =>
        expect(e.message).to.equal('jwt mlaformed')
      );
    });

    it('create can set options and verify fails with expired token', () => {
      return auth.createJWT({
        name: 'Eric'
      }, {
        expiresIn: '50ms'
      }).then(data =>
        timeout(() => auth.verifyJWT(data), 100)
      ).catch(error =>
        expect(error.message).to.equal('jwt expired')
      );
    });
  });
});
