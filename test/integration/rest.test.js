import { expect } from 'chai';
import rp from 'request-promise';
import createApplication from '../fixtures/server';

describe('REST authentication', function() {
  this.timeout(10000);

  const request = rp.defaults({
    baseUrl: 'http://localhost:8998',
    json: true
  });
  const app = createApplication({
    secret: 'supersecret'
  });

  before(function(done) {
    this.server = app.listen(8998);
    this.server.once('listening', () => done());
  });

  after(function() {
    this.server.close();
  });

  it('returns not authenticated error for protected endpoint', () => {
    return request({
      url: '/todos/laundry'
    }).catch(error => {
      expect(error.error).to.deep.equal({
        name: 'NotAuthenticated',
        message: 'You are not authenticated.',
        code: 401,
        className: 'not-authenticated',
        errors: {}
      });
    });
  });

  it('creates a valid token via HTTP with custom auth', () => {
    return request({
      url: '/authentication',
      method: 'POST',
      body: {
        login: 'testing'
      }
    }).then(body => {
      expect(body.token).to.exist;
      return app.authentication.verifyJWT(body);
    }).then(verifiedToken => {
      const p = verifiedToken.payload;

      expect(p).to.exist;
      expect(p.iss).to.equal('feathers');
      expect(p.userId).to.equal(0);
      expect(p.authentication).to.equal('test-auth');
    });
  });

  it('allows access to protected service with valid token, populates user', () => {
    return request({
      url: '/authentication',
      method: 'POST',
      body: {
        login: 'testing'
      }
    }).then(login =>
      request({
        url: '/todos/dishes',
        headers: {
          'Authorization': login.token
        }
      })
    ).then(data => {
      expect(data).to.deep.equal({
        id: 'dishes',
        description: 'You have to do dishes',
        user: { id: 0, name: 'Tester' }
      });
    });
  });
});
