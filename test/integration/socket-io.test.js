import { expect } from 'chai';
import io from 'socket.io-client';
import createApplication from '../test-server';
import jwt from 'jsonwebtoken';

describe('Socket.io authentication', function() {
  this.timeout(15000);
  const host = 'http://localhost:8888';

  let server, app, socket;
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
    createApplication(settings, email, password, true, (err, obj) =>{
      app = obj.app;
      server = obj.server;
      
      setTimeout(done, 10);
    });
  });

  after(function(done) {
    server.close(done);
  });

  beforeEach(done => {
    socket = io(host, { transport: ['websockets'] });
    socket.on('connect', function() {
      done();
    });
  });

  afterEach(() => {
    socket.disconnect();
  });

  describe('Local authentication', () => {
    describe('when login unsuccessful', () => {
      it('returns a 401 when user not found', function(done) {
        const data = {
          email: 'not-found@feathersjs.com',
          password
        };
        
        socket.on('unauthorized', function(error) {
          expect(error.code).to.equal(401);
          done();
        });

        socket.emit('authenticate', data);
      });

      it('returns a 401 when password is invalid', function(done) {
        const data = {
          email: 'testd@feathersjs.com',
          password: 'invalid'
        };

        socket.on('unauthorized', function(error) {
          expect(error.code).to.equal(401);
          done();
        });

        socket.emit('authenticate', data);
      });

      it.skip('disconnects the socket', function(done) {
        const data = {
          email: 'testd@feathersjs.com',
          password: 'invalid'
        };

        socket.on('disconnect', function(error) {
          expect(error.code).to.equal(401);
          done();
        });

        socket.emit('authenticate', data);
      });
    });

    describe('when login succeeds', () => {
      it('returns a JWT', function(done) {
        const data = {
          email,
          password
        };
        
        socket.on('authenticated', function(response) {
          expect(response.token).to.not.equal(undefined);
          done();
        });

        socket.emit('authenticate', data);
      });

      it('returns the logged in user', function(done) {
        const data = {
          email,
          password
        };
        
        socket.on('authenticated', function(response) {
          expect(response.user.email).to.equal('test@feathersjs.com');
          done();
        });

        socket.emit('authenticate', data);
      });

      it('does not emit a create event from local service', function(done) {
        const data = {
          email,
          password
        };

        let receivedLocalEvent = false;

        socket.on('auth/local created', function() {
          receivedLocalEvent = true;
        });

        socket.on('authenticated', function() {
          setTimeout(function() {
            expect(receivedLocalEvent).to.equal(false);
            done();
          }, 100);
        });

        socket.emit('authenticate', data);
      });

      it('does not emit a create event from token service', function(done) {
        const data = {
          email,
          password
        };

        let receivedTokenEvent = false;

        socket.on('auth/token created', function() {
          receivedTokenEvent = true;
        });

        socket.on('authenticated', function() {
          setTimeout(function() {
            expect(receivedTokenEvent).to.equal(false);
            done();
          }, 100);
        });

        socket.emit('authenticate', data);
      });
    });
  });

  describe('Token authentication', () => {
    describe('when login unsuccessful', () => {

      it('returns a 401 when token is invalid', function(done) {
        const data = {
          token: 'invalid'
        };

        socket.on('unauthorized', function(error) {
          expect(error.code).to.equal(401);
          done();
        });

        socket.emit('authenticate', data);
      });

      it('returns a 401 when token is expired', function(done) {
        const data = {
          token: expiredToken
        };

        socket.on('unauthorized', function(error) {
          expect(error.code).to.equal(401);
          done();
        });

        socket.emit('authenticate', data);
      });

      it.skip('disconnects the socket', function(done) {
        const data = {
          token: expiredToken
        };

        socket.on('disconnect', function(error) {
          expect(error.code).to.equal(401);
          done();
        });

        socket.emit('authenticate', data);
      });
    });

    describe('when login succeeds', () => {
      const data = { token: validToken };

      it('returns a JWT', function(done) {        
        socket.on('authenticated', function(response) {
          expect(response.token).to.not.equal(undefined);
          done();
        });

        socket.emit('authenticate', data);
      });

      it.skip('returns the logged in user', function(done) {
        socket.on('authenticated', function(response) {
          expect(response.user.email).to.equal('test@feathersjs.com');
          done();
        });

        socket.emit('authenticate', data);
      });
    });
  });

  describe('OAuth1 authentication', () => {
    // TODO (EK): This isn't really possible with sockets unless
    // you are sending auth_tokens from your OAuth1 provider
  });

  describe('OAuth2 authentication', () => {
    // TODO (EK): This isn't really possible with sockets unless
    // you are sending auth_tokens from your OAuth2 provider
  });

  describe('Authorization', () => {
    describe('when authenticated', () => {
      it('returns data from protected route', (done) => {
        const data = { token: validToken };

        socket.on('authenticated', function() {
          socket.emit('messages::get', 1, {}, (error, data) => {
            expect(data.id).to.equal(1);
            done();
          });
        });

        socket.emit('authenticate', data);
      });
    });

    describe('when not authenticated', () => {
      it('returns 401 from protected route', (done) => {
        socket.emit('messages::get', 1, {}, (error) => {
          expect(error.code).to.equal(401);
          done();
        });
      });

      it('does not return data from protected route', (done) => {
        socket.emit('messages::get', 1, {}, (error, data) => {
          expect(data).to.equal(undefined);
          done();
        });
      });

      it('returns data from unprotected route', (done) => {
        socket.emit('users::find', {}, (error, data) => {
          expect(data).to.not.equal(undefined);
          done();
        });
      });
    });
  });
});
