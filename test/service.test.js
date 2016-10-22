import { expect, assert } from 'chai';
import feathers from 'feathers';
import hooks from 'feathers-hooks';
import authentication from '../src';

describe('/authentication service', () => {
  const app = feathers().configure(hooks())
    .configure(authentication({
      secret: 'supersecret'
    }));

  it('throws an error when service option is not set', () => {
    try {
      feathers().configure(authentication({
        secret: 'dummy',
        service: null
      }));
      assert.ok(false, 'Should never get here');
    } catch(e) {
      expect(e.message).to.equal(`Authentication option for 'service' needs to be set`);
    }
  });

  it('configures the service with options on app', () => {
    assert.ok(app.service('authentication'));
  });

  it('internal .create creates a token with payload', () => {
    const payload = { testing: true };

    return app.service('authentication')
      .create({ payload }).then( ({ token }) => {
        assert.ok(token);

        return app.authentication.verifyJWT(token);
      }).then( ({ payload }) =>
        assert.ok(payload.testing)
      );
  });

  it('.remove verifies the token', () => {
    const payload = { testing: true };

    return app.authentication.createJWT(payload)
      .then( ({ token }) =>
        app.service('authentication').remove(token)
      ).then(result => {
        assert.ok(result.payload.testing);
      });
  });

  it('.create with params.provider, no params.authentication throws', () => {
    return app.service('authentication').create({}, {
      provider: 'dummy'
    }).catch(e => {
      expect(e.message).to.equal(`External dummy requests need to run through an authentication provider`);
    });
  });
});
