import { expect } from 'chai';
import createApplication from '../fixtures/server';

describe('Primus authentication', function() {
  this.timeout(10000);

  const PORT = 9889;
  const app = createApplication({
    secret: 'supersecret'
  }, false);

  let primus, Socket;

  before(function(done) {
    this.server = app.listen(PORT);
    this.server.once('listening', () => {
      Socket = app.primus.Socket;
      done();
    });
  });

  beforeEach(done => {
    primus = new Socket(`http://localhost:${PORT}`);
    primus.on('open', () => done());
  });

  after(function() {
    this.server.close();
  });

  it('returns not authenticated error for protected endpoint', done => {
    primus.send('todos::get', 'laundry', e => {
      expect(e.name).to.equal('NotAuthenticated');
      expect(e.code).to.equal(401);

      done();
    });
  });

  it('creates a token using the `authenticate` event', done => {
    primus.send('authenticate', {
      login: 'testing'
    }, function(error, data) {
      expect(error).to.not.be.ok;
      expect(data.token).to.exist;
      done();
    });
  });

  it('`authenticate` with error', done => {
    primus.send('authenticate', {
      login: 'testing-fail'
    }, function(error) {
      expect(error).to.be.ok;
      expect(error.name).to.equal('NotAuthenticated');
      done();
    });
  });

  it('authenticated socket allows accesss and populates user', done => {
    primus.send('authenticate', {
      login: 'testing'
    }, function(error) {
      if(error) {
        return done(error);
      }

      primus.send('todos::get', 'laundry', function(error, data) {
        expect(data).to.deep.equal({
          id: 'laundry',
          description: 'You have to do laundry',
          user: { id: 0, name: 'Tester' }
        });
        done();
      });
    });
  });

  it('app `login` event', done => {
    app.once('login', function(result, info) {
      expect(result.token).to.exist;
      expect(result.payload).to.exist;
      expect(result.payload.userId).to.equal(0);
      expect(result.authenticated).to.be.ok;
      expect(result.user).to.deep.equal({ id: 0, name: 'Tester' });

      expect(info.provider).to.equal('primus');
      expect(info.connection.token).to.equal(result.token);
      expect(info.socket).to.exist;

      done();
    });

    primus.send('authenticate', {
      login: 'testing'
    });
  });

  it('app `logout` event', done => {
    app.once('logout', function(result, info) {
      expect(result.token).to.exist;
      expect(result.payload).to.exist;
      expect(result.payload.userId).to.equal(0);
      expect(result.authenticated).to.be.ok;
      expect(result.user).to.deep.equal({ id: 0, name: 'Tester' });

      expect(info.provider).to.equal('primus');
      expect(info.socket).to.exist;

      done();
    });

    primus.send('authenticate', {
      login: 'testing'
    }, () => primus.send('logout'));
  });

  it('disconnecting sends `logout` event', done => {
    primus.send('authenticate', {
      login: 'testing'
    }, function(error) {
      if(error) {
        return done(error);
      }

      app.once('logout', function(result, info) {
        expect(result.token).to.exist;
        expect(result.payload).to.exist;
        expect(result.payload.userId).to.equal(0);
        expect(result.authenticated).to.be.ok;
        expect(result.user).to.deep.equal({ id: 0, name: 'Tester' });

        expect(info.provider).to.equal('primus');
        expect(info.socket).to.exist;

        done();
      });

      primus.end();
    });
  });

  it('no access allowed after logout', done => {
    app.once('logout', function() {
      primus.send('todos::get', 'laundry', e => {
        expect(e.name).to.equal('NotAuthenticated');
        expect(e.code).to.equal(401);

        done();
      });
    });

    primus.send('authenticate', {
      login: 'testing'
    }, () => primus.send('logout'));
  });
});
