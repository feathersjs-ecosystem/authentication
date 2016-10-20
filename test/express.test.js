import { expect } from 'chai';
import rp from 'request-promise';
import cookie from 'cookie';
import ms from 'ms';
import createServer from './server';

describe('Express middleware tests', function() {
  const PORT = 7887;

  this.timeout(10000);

  const request = rp.defaults({
    baseUrl: `http://localhost:${PORT}`,
    json: true
  });
  const app = createServer({
    secret: 'express-middleware',
    cookie: { enabled: true }
  });

  before(function(done) {
    this.server = app.listen(PORT);
    this.server.once('listening', () => done());
  });

  after(function() {
    this.server.close();
  });

  describe('getJWT', () => {
    it('is empty when not set', () => {
      return request('/get-jwt').then(body => {
        expect(body).to.deep.equal({});
      });
    });

    it('is parsed from authorization header', () => {
      return request({
        url: '/get-jwt',
        headers: {
          authorization: 'test'
        }
      }).then(body => {
        expect(body).to.deep.equal({ token: 'test' });
      });
    });

    it('is parsed from authorization bearer header', () => {
      return request({
        url: '/get-jwt',
        headers: {
          Authorization: 'Bearer testing'
        }
      }).then(body => {
        expect(body).to.deep.equal({ token: 'testing' });
      });
    });
  });

  describe('setCookie', () => {
    it('sets the cookie on successful authentication', () => {
        return request({
        url: '/authentication',
        method: 'POST',
        resolveWithFullResponse: true,
        body: {
          login: 'testing'
        }
      }).then(res => {
        expect(res.body.token).to.exist;

        const setCookies = res.headers['set-cookie'];
        const parsed = cookie.parse(setCookies[setCookies.length - 1]);
        const expires = new Date(parsed.Expires);
        const expectedExpires = new Date(new Date().getTime() +
          ms(app.authentication.options.jwt.expiresIn)
        );

        expect(parsed['feathers-jwt']).to.equal(res.body.token);
        expect(expires.getDate()).to.equal(expectedExpires.getDate());
        expect(expires.getHours()).to.equal(expectedExpires.getHours());
        expect(expires.getMinutes()).to.equal(expectedExpires.getMinutes());
      });
    });
  });
});
