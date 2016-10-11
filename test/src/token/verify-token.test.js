import { expect } from 'chai';
import feathers from 'feathers';
import authentication from '../../../src';
import verifyToken from '../../../src/token/verify-token';

describe('Token Middleware verifyToken', () => {
  const app = feathers()
    .configure(authentication({
      secret: 'supersecrect'
    }).use(verifyToken));
  const auth = app.authentication;

  it('passes through when nothing useful is passed', () => {
    const dummy = { test: 'me' };

    return auth.authenticate(dummy).then(data =>
      expect(data).to.equal(dummy)
    );
  });

  it('.authenticate verifies a token', () => {
    const payload = { test: 'data' };

    return auth.createJWT(payload).then(data =>
      auth.authenticate(data)
    ).then(data => {
      expect(data.payload.test).to.equal(payload.test);
      expect(data.authenticated).to.equal(true);
    });
  });

  it('.authenticate verifies a string token', () => {
    const payload = { test: 'data' };

    return auth.createJWT(payload).then(data =>
      auth.authenticate(data.token)
    ).then(data => {
      expect(data.payload.test).to.equal(payload.test);
      expect(data.authenticated).to.equal(true);
    });
  });
});
