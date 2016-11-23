import merge from 'lodash.merge';
import io from 'socket.io-client';
import createApplication from '../fixtures/server';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

describe('Primus authentication', function() {
  const port = 8998;
  const baseURL = `http://localhost:${port}`;
  const app = createApplication({ secret: 'supersecret' }, 'primus');
  const expiringApp = createApplication({
    secret: 'supersecret',
    jwt: { expiresIn: '500ms' }
  }, 'primus');

  let server;
  let socket;
  let Socket;
  let serverSocket;
  let ExpiringSocket;
  let expiringServer;
  let expiringSocket;
  let expiredToken;
  let accessToken;
  
  before(done => {
    const options = merge({}, app.get('auth'), { jwt: { expiresIn: '1ms' } });
    app.passport.createJWT({}, options)
      .then(token => {
        expiredToken = token;
        return app.passport.createJWT({ userId: 0 }, app.get('auth'));
      })
      .then(token => {
        accessToken = token;
        expiringServer = expiringApp.listen(1337);
        expiringServer.once('listening', () => {
          ExpiringSocket = expiringApp.primus.Socket;
          server = app.listen(port);
          server.once('listening', () => {
            Socket = app.primus.Socket;
            app.primus.on('connection', s => serverSocket = s);
            done();
          });
        });
      });
  });

  beforeEach(done => {
    expiringSocket = new ExpiringSocket('http://localhost:1337');
    expiringSocket.on('open', () => {
      socket = new Socket(baseURL);
      socket.on('open', () => done());
    });
  });

  after(() => {
    expiringServer.close();
    server.close();
  });

  describe('Authenticating against auth service', () => {
    describe('Using local strategy', () => {
      let data;

      beforeEach(() => {
        data = {
          strategy: 'local',
          email: 'admin@feathersjs.com',
          password: 'admin'
        };
      });

      describe('when using valid credentials', () => {
        it('returns a valid access token', done => {
          socket.send('authenticate', data, (error, response) => {
            expect(response.accessToken).to.exist;
            app.passport.verifyJWT(response.accessToken, app.get('auth')).then(payload => {
              expect(payload).to.exist;
              expect(payload.iss).to.equal('feathers');
              expect(payload.userId).to.equal(0);
              done();
            });
          });
        });

        it('sets the user on the socket', done => {
          socket.send('authenticate', data, (error, response) => {
            expect(response.accessToken).to.exist;
            expect(serverSocket.request.feathers.user).to.not.equal(undefined);
            done();
          });
        });

        it('sets entity specified in strategy', done => {
          data.strategy = 'org-local';
          socket.send('authenticate', data, (error, response) => {
            expect(response.accessToken).to.exist;
            expect(serverSocket.request.feathers.org).to.not.equal(undefined);
            done();
          });
        });
      });

      describe('when using invalid credentials', () => {
        it('returns NotAuthenticated error', done => {
          data.password = 'invalid';
          socket.send('authenticate', data, error => {
            expect(error.code).to.equal(401);
            done();
          });
        });
      });

      describe('when missing credentials', () => {
        it('returns NotAuthenticated error', done => {
          socket.send('authenticate', { strategy: 'local' }, error => {
            expect(error.code).to.equal(401);
            done();
          });
        });
      });

      describe('when missing strategy', () => {
        it('returns BadRequest error', done => {
          delete data.strategy;
          socket.send('authenticate', data, error => {
            expect(error.code).to.equal(400);
            done();
          });
        });
      });
    });

    describe('Using JWT strategy', () => {
      let data;

      beforeEach(() => {
        data = {
          strategy: 'jwt',
          accessToken
        };
      });

      describe('when using a valid access token', () => {
        it('returns a valid access token', done => {
          socket.send('authenticate', data, (error, response) => {
            expect(response.accessToken).to.exist;
            app.passport.verifyJWT(response.accessToken, app.get('auth')).then(payload => {
              expect(payload).to.exist;
              expect(payload.iss).to.equal('feathers');
              expect(payload.userId).to.equal(0);
              done();
            });
          });
        });
      });

      describe.skip('when using a valid refresh token', () => {
        it('returns a valid access token', done => {
          delete data.accessToken;
          data.refreshToken = 'refresh';
          socket.send('authenticate', data, (error, response) => {
            expect(response.accessToken).to.exist;
            app.passport.verifyJWT(response.accessToken, app.get('auth')).then(payload => {
              expect(payload).to.exist;
              expect(payload.iss).to.equal('feathers');
              expect(payload.userId).to.equal(0);
              done();
            });
          });
        });
      });

      describe('when access token is invalid', () => {
        it('returns NotAuthenticated error', done => {
          data.accessToken = 'invalid';
          socket.send('authenticate', data, error => {
            expect(error.code).to.equal(401);
            done();
          });
        });
      });

      describe('when access token is missing', () => {
        it('returns NotAuthenticated error', done => {
          delete data.accessToken;
          socket.send('authenticate', data, error => {
            expect(error.code).to.equal(401);
            done();
          });
        });
      });

      describe('when access token is expired', () => {
        it('returns NotAuthenticated error', done => {
          data.accessToken = expiredToken;
          socket.send('authenticate', data, error => {
            expect(error.code).to.equal(401);
            done();
          });
        });
      });

      describe('when missing strategy', () => {
        it('returns BadRequest error', done => {
          delete data.strategy;
          socket.send('authenticate', data, error => {
            expect(error.code).to.equal(400);
            done();
          });
        });
      });
    });
  });

  describe('when calling a protected service method', () => {
    describe('when not authenticated', () => {
      it('returns NotAuthenticated error', done => {
        socket.send('users::find', {}, error => {
          expect(error.code).to.equal(401);
          done();
        });
      });
    });

    describe('when access token is expired', () => {
      it('returns NotAuthenticated error', done => {
        const data = {
          strategy: 'local',
          email: 'admin@feathersjs.com',
          password: 'admin'
        };

        expiringSocket.send('authenticate', data, (error, response) => {
          expect(response).to.be.ok;
          // Wait for the accessToken to expire
          setTimeout(function() {
            expiringSocket.send('users::find', {}, (error, response) => {
              expect(error.code).to.equal(401);
              done();
            });
          }, 1000);
        });
      });
    });

    describe('when authenticated', () => {
      it('returns data', done => {
        const data = {
          strategy: 'jwt',
          accessToken
        };

        socket.send('authenticate', data, (error, response) => {
          expect(response).to.be.ok;
          socket.send('users::find', {}, (error, response) => {
            expect(response.length).to.equal(1);
            expect(response[0].id).to.equal(0);
            done();
          });
        });
      });
    });
  });

  describe('when calling an un-protected service method', () => {
    describe('when not authenticated', () => {
      it('returns data', done => {
        socket.send('users::get', 0, (error, response) => {
          expect(response.id).to.equal(0);
          done();
        });
      });
    });

    describe('when access token is expired', () => {
      it('returns data', done => {
        const data = {
          strategy: 'local',
          email: 'admin@feathersjs.com',
          password: 'admin'
        };

        expiringSocket.send('authenticate', data, (error, response) => {
          expect(response).to.be.ok;
          // Wait for the accessToken to expire
          setTimeout(function() {
            socket.send('users::get', 0, (error, response) => {
              expect(response.id).to.equal(0);
              done();
            });
          }, 1000);
        });
      });
    });

    describe('when authenticated', () => {
      it('returns data', done => {
        const data = {
          strategy: 'jwt',
          accessToken
        };

        socket.send('authenticate', data, (error, response) => {
          expect(response).to.be.ok;
          socket.send('users::get', 0, (error, response) => {
            expect(response.id).to.equal(0);
            done();
          });
        });
      });
    });
  });

  describe.skip('when redirects are enabled', () => {
    let data;

    beforeEach(() => {
      data = {
        strategy: 'local',
        email: 'admin@feathersjs.com',
        password: 'admin'
      };
    });

    describe('authentication succeeds', () => {
      it('redirects', done => {
        socket.send('authenticate', data, (error, response) => {
          expect(response.redirect).to.equal(true);
          expect(response.url).to.be.ok;
          done();
        });
      });
    });

    describe('authentication fails', () => {
      it('redirects', done => {
        delete data.password;
        socket.send('authenticate', data, (error, response) => {
          expect(response.redirect).to.equal(true);
          expect(response.url).to.be.ok;
          done();
        });
      });
    });
  });

  describe('events', () => {
    let data;

    beforeEach(() => {
      data = {
        strategy: 'local',
        email: 'admin@feathersjs.com',
        password: 'admin'
      };
    });

    describe('when authentication succeeds', () => {
      it('emits login event', done => {
        app.once('login', function(auth, info) {
          expect(info.provider).to.equal('primus');
          expect(info.socket).to.exist;
          expect(info.connection).to.exist;
          done();
        });

        socket.send('authenticate', data);
      });
    });

    describe('authentication fails', () => {
      it('does not emit login event', done => {
        data.password = 'invalid';
        const handler = sinon.spy();
        app.once('login', handler);

        socket.send('authenticate', data, error => {
          expect(error.code).to.equal(401);

          setTimeout(function() {
            expect(handler).to.not.have.been.called;
            done();
          }, 100);
        });
      });
    });

    describe('when logout succeeds', () => {
      it('emits logout event', done => {
        app.once('logout', function(auth, info) {
          expect(info.provider).to.equal('primus');
          expect(info.socket).to.exist;
          expect(info.connection).to.exist;
          done();
        });
        
        socket.send('authenticate', data, (error, response) => {
          expect(response).to.be.ok;
          socket.send('logout', data);
        });
      });
    });
  });
});