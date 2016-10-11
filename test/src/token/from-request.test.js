import { expect } from 'chai';
import feathers from 'feathers';
import authentication from '../../../src';
import fromRequest from '../../../src/token/from-request';

describe('Token Middleware fromRequest', () => {
  const app = feathers()
    .configure(authentication({
      secret: 'supersecrect'
    }).use(fromRequest));
  const auth = app.authentication;

  it('throws an error when header name is not set', () => {
    try {
      fromRequest({});
    } catch(e) {
      expect(e.message).to.equal(`'header' property must be set in authentication options`);
    }
  });

  it('passes through when it is not a request object', () => {
    auth.authenticate('testtoken').then(data =>
      expect(data).to.equal('testtoken')
    );
  });

  it('parses basic authorization header', () => {
    const mockRequest = {
      headers: {
        authorization: 'sometoken'
      }
    };

    return auth.authenticate(mockRequest).then(data => {
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

    return auth.authenticate(mockRequest).then(data => {
      expect(data.req).to.equal(mockRequest);
      expect(data.token).to.equal('sometoken');
    });
  });
});
