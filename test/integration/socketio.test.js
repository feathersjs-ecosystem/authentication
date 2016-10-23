import { expect } from 'chai';
import io from 'socket.io-client';
import createApplication from '../fixtures/server';

describe('Socket.io authentication', function() {
  this.timeout(10000);

  const PORT = 8998;
  const app = createApplication({
    secret: 'supersecret'
  });

  let socket;

  before(function(done) {
    this.server = app.listen(PORT);
    this.server.once('listening', () => {
      socket = io(`http://localhost:${PORT}`);
      done();
    });
  });

  after(function() {
    this.server.close();
  });

  it('returns not authenticated error for protected endpoint', done => {
    socket.emit('todos::get', 'laundry', e => {
      delete e.stack;
      delete e.type;

      expect(e).to.deep.equal({
        name: 'NotAuthenticated',
        message: 'You are not authenticated.',
        code: 401,
        className: 'not-authenticated',
        errors: {}
      });
      done();
    });
  });

  it('creates a valid token using the `authenticate` event', done => {
    socket.emit('authenticate', {
      login: 'testing'
    }, function(error, data) {
      expect(error).to.not.be.ok;
      expect(data.token).to.exist;
      done();
    });
  });

  it('authenticated socket allows accesss and populates user', done => {
    socket.emit('authenticate', {
      login: 'testing'
    }, function(error) {
      if(error) {
        return done(error);
      }

      socket.emit('todos::get', 'laundry', function(error, data) {
        expect(data).to.deep.equal({
          id: 'laundry',
          description: 'You have to do laundry',
          user: { id: 0, name: 'Tester' }
        });
        done();
      });
    });
  });

  it('app login and logout events', done => {
    app.once('login', function(result, info) {
      expect(result.token).to.exist;
      expect(result.payload).to.exist;
      expect(result.payload.userId).to.equal(0);
      expect(result.authenticated).to.be.ok;
      expect(result.user).to.deep.equal({ id: 0, name: 'Tester' });

      expect(info.provider).to.equal('socketio');
      expect(info.connection.token).to.equal(result.token);
      expect(info.socket).to.exist;

      socket.emit('logout', function() {
        done();
      });
    });

    app.once('logout', function(result, info) {
      expect(result.token).to.exist;
      expect(result.payload).to.exist;
      expect(result.payload.userId).to.equal(0);
      expect(result.authenticated).to.be.ok;
      expect(result.user).to.deep.equal({ id: 0, name: 'Tester' });

      expect(info.provider).to.equal('socketio');
      expect(info.connection.token).to.equal(result.token);
      expect(info.socket).to.exist;

      done();
    });

    socket.emit('authenticate', {
      login: 'testing'
    });
  });
});
