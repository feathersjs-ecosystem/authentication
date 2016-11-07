import { expect } from 'chai';
import axios from 'axios';
import createApplication from '../fixtures/server';

describe.skip('REST authentication', function() {
  this.timeout(10000);

  const request = axios.create({
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

  it('app `login` event', done => {
    app.once('login', function(auth, info) {
      expect(auth.token).to.exist;
      expect(auth.user).to.deep.equal({ id: 0, name: 'Tester' });

      expect(info.provider).to.equal('rest');
      expect(info.req).to.exist;
      expect(info.res).to.exist;

      done();
    });

    request({
      url: '/authentication',
      method: 'POST',
      body: {
        login: 'testing'
      }
    });
  });

  it('app `logout` event', done => {
    app.once('logout', function(auth, info) {
      expect(auth.token).to.exist;
      expect(auth.user).to.deep.equal({ id: 0, name: 'Tester' });

      expect(info.provider).to.equal('rest');
      expect(info.req).to.exist;
      expect(info.res).to.exist;

      done();
    });

    request({
      url: '/authentication',
      method: 'POST',
      body: {
        login: 'testing'
      }
    }).then(login => request({
      url: `/authentication`,
      method: 'DELETE',
      headers: {
        'Authorization': login.token
      }
    }));
  });
});
