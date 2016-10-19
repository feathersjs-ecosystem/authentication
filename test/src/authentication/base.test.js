import { expect } from 'chai';
import Authentication from '../../../src/authentication/base';
import tokenMiddleware from '../../../src/token';
import getOptions from '../../../src/options';

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

  it('initially has default middleware and replaces it', () => {
    const a = new Authentication(app, options);

    expect(a._middleware).to.equal(tokenMiddleware);

    a.use(function() {});
    expect(a._middleware).to.not.equal(tokenMiddleware);
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
