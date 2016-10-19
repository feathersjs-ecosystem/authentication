import { expect } from 'chai';
import feathers from 'feathers';
import authentication from '../../../src';
import populateUser from '../../../src/token/populate-user';

describe('Token Middleware fromRequest', () => {
  const app = feathers()
    .configure(authentication({
      secret: 'supersecrect',
      user: {
        payloadField: 'name',
        service: '/users'
      }
    }))
    .use('/users', {
      get(name) {
        if(name === 'error') {
          return Promise.reject(new Error('User not found'));
        }

        return Promise.resolve({ name, username: `Test ${name}` });
      }
    });
  const auth = app.authentication.use(populateUser);

  it('populates the user from id in payload', () => {
    auth.authenticate({
      payload: { name: 'testing' }
    }).then(data => {
      expect(data.authenticated).to.equal(true);
      expect(data.user).to.deep.equal({
        name: 'testing',
        username: 'Test testing'
      });
    });
  });

  it('errors when id exists but user is not found', () => {
    auth.authenticate({
      payload: { name: 'error' }
    }).catch(error =>
      expect(error.message).to.equal('User not found')
    );
  });

  it('does nothing when payload does not exist', () => {
    const original = {
      dummy: true
    };

    auth.authenticate(original).then(data =>
      expect(data).to.equal(original)
    );
  });
});
