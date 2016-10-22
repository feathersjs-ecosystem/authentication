// import { expect } from 'chai';
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
    socket.emit('authenticate', {
      login: 'testing'
    }, function() {
      console.log(arguments);
      done();
    });
  });

  // it('creates a valid token via HTTP with custom auth', () => {
  //   return request({
  //     url: '/authentication',
  //     method: 'POST',
  //     body: {
  //       login: 'testing'
  //     }
  //   }).then(body => {
  //     expect(body.token).to.exist;
  //     return app.authentication.verifyJWT(body);
  //   }).then(verifiedToken => {
  //     const p = verifiedToken.payload;

  //     expect(p).to.exist;
  //     expect(p.iss).to.equal('feathers');
  //     expect(p.userId).to.equal(0);
  //     expect(p.authentication).to.equal('test-auth');
  //   });
  // });

  // it('allows access to protected service with valid token, populates user', () => {
  //   return request({
  //     url: '/authentication',
  //     method: 'POST',
  //     body: {
  //       login: 'testing'
  //     }
  //   }).then(login =>
  //     request({
  //       url: '/todos/dishes',
  //       headers: {
  //         'Authorization': login.token
  //       }
  //     })
  //   ).then(data => {
  //     expect(data).to.deep.equal({
  //       id: 'dishes',
  //       description: 'You have to do dishes',
  //       user: { id: 0, name: 'Tester' }
  //     });
  //   });
  // });
});
