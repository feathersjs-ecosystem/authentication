import { expect } from 'chai';
import createApplication from '../test-server';
import jwt from 'jsonwebtoken';

describe('Primus authentication', function() {
  this.timeout(15000);
  const host = 'http://localhost:8888';

  let server, app, primus, Socket;
  let email = 'test@feathersjs.com';
  let password = 'test';
  let settings = {
    user: {
      idField: 'id'
    },
    token: {
      secret: 'feathers-rocks'
    }
  };
  let jwtOptions = {
    issuer: 'feathers',
    subject: 'auth',
    algorithm: 'HS256',
    expiresIn: '1h' // 1 hour
  };

  // create a valid JWT
  let validToken = jwt.sign({ id: 0 }, settings.token.secret, jwtOptions);

  // create an expired JWT
  jwtOptions.expiresIn = 1; // 1 ms
  let expiredToken = jwt.sign({ id: 0 }, settings.token.secret, jwtOptions);

  before((done) => {
    createApplication(settings, email, password, false, (err, obj) =>{
      app = obj.app;
      server = obj.server;
      Socket = app.primus.Socket;

      // Add a quick timeout to make sure that our token is expired
      setTimeout(done, 1000);
    });
  });

  after(function() {
    server.close();
  });

  beforeEach(done => {
    primus = new Socket(host);
    primus.on('open', function() {
      done();
    });
  });

  afterEach(() => {
    primus.end();
  });

  describe('Local authentication', () => {
    describe('when login unsuccessful', () => {
      it('returns a 401 when user not found', function(done) {
        const data = {
          email: 'not-found@feathersjs.com',
          password
        };

        primus.on('unauthorized', function(error) {
          expect(error.code).to.equal(401);
          done();
        });

        primus.send('authenticate', data);
      });

      it('returns a 401 when password is invalid', function(done) {
        const data = {
          email: 'testd@feathersjs.com',
          password: 'invalid'
        };

        primus.on('unauthorized', function(error) {
          expect(error.code).to.equal(401);
          done();
        });

        primus.send('authenticate', data);
      });

      it.skip('disconnects the socket', function(done) {
        const data = {
          token: expiredToken
        };

        primus.on('close', function() {
          done();
        });

        primus.send('authenticate', data);
      });
    });

    describe('when login succeeds', () => {
      it('returns a JWT', function(done) {
        const data = {
          email,
          password
        };

        primus.on('authenticated', function(response) {
          expect(response.token).to.not.equal(undefined);
          done();
        });

        primus.send('authenticate', data);
      });

      it('returns the logged in user', function(done) {
        const data = {
          email,
          password
        };

        primus.on('authenticated', function(response) {
          expect(response.user.email).to.equal('test@feathersjs.com');
          done();
        });

        primus.send('authenticate', data);
      });

      it('does not send a create event from local service', function(done) {
        const data = {
          email,
          password
        };

        let receivedLocalEvent = false;

        primus.on('auth/local created', function() {
          receivedLocalEvent = true;
        });

        primus.on('authenticated', function() {
          setTimeout(function() {
            expect(receivedLocalEvent).to.equal(false);
            done();
          }, 100);
        });

        primus.send('authenticate', data);
      });

      it('does not send a create event from token service', function(done) {
        const data = {
          email,
          password
        };

        let receivedTokenEvent = false;

        primus.on('auth/token created', function() {
          receivedTokenEvent = true;
        });

        primus.on('authenticated', function() {
          setTimeout(function() {
            expect(receivedTokenEvent).to.equal(false);
            done();
          }, 100);
        });

        primus.send('authenticate', data);
      });
    });
  });

  describe('Token authentication', () => {
    describe('when login unsuccessful', () => {

      it('returns a 401 when token is invalid', function(done) {
        const data = {
          token: 'invalid'
        };

        primus.on('unauthorized', function(error) {
          expect(error.code).to.equal(401);
          done();
        });

        primus.send('authenticate', data);
      });

      it('returns a 401 when token is expired', function(done) {
        const data = {
          token: expiredToken
        };

        primus.on('unauthorized', function(error) {
          expect(error.code).to.equal(401);
          done();
        });

        primus.send('authenticate', data);
      });

      it.skip('disconnects the socket', function(done) {
        const data = {
          token: expiredToken
        };

        primus.on('close', function() {
          done();
        });

        primus.send('authenticate', data);
      });
    });

    describe('when login succeeds', () => {
      const data = { token: validToken };

      it('returns a JWT', function(done) {
        primus.on('authenticated', function(response) {
          expect(response.token).to.not.equal(undefined);
          done();
        });

        primus.send('authenticate', data);
      });

      it.skip('returns the logged in user', function(done) {
        primus.on('authenticated', function(response) {
          expect(response.user.email).to.equal('test@feathersjs.com');
          done();
        });

        primus.send('authenticate', data);
      });
    });
  });

  describe('OAuth1 authentication', () => {
    // TODO (EK): This isn't really possible with primus unless
    // you are sending auth_tokens from your OAuth1 provider
  });

  describe('OAuth2 authentication', () => {
    // TODO (EK): This isn't really possible with primus unless
    // you are sending auth_tokens from your OAuth2 provider
  });

  describe('Authorization', () => {
    describe('when authenticated', () => {
      it('returns data from protected route', (done) => {
        const data = { token: validToken };

        primus.on('authenticated', function() {
          primus.send('messages::get', 1, {}, (error, data) => {
            expect(data.id).to.equal(1);
            done();
          });
        });

        primus.send('authenticate', data);
      });
    });

    describe('when not authenticated', () => {
      it('returns 401 from protected route', (done) => {
        primus.send('messages::get', 1, {}, (error) => {
          expect(error.code).to.equal(401);
          done();
        });
      });

      it('does not return data from protected route', (done) => {
        primus.send('messages::get', 1, {}, (error, data) => {
          expect(data).to.equal(undefined);
          done();
        });
      });

      it('returns data from unprotected route', (done) => {
        primus.send('users::find', {}, (error, data) => {
          expect(data).to.not.equal(undefined);
          done();
        });
      });
    });
  });
});
