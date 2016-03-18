import assert from 'assert';
import { hashPassword } from '../../../src/hooks';

describe('hashPassword()', () => {
  describe('when hook.data does not exist', () => {
    it('does not do anything', () => {
      let hook = {
        foo: { password: 'password' }
      };

      hook = hashPassword()(hook);
      assert.equal(hook.data, undefined);
    });
  });

  describe('when hook.data does exist', () => {
    it('attaches hashed password to hook.data', (done) => {
      let hook = {
        data: { password: 'password' }
      };

      hashPassword()(hook).then(hook => {
        assert.ok(hook.data.password);
        assert.notEqual(hook.data.custom, 'password');
        done();
      });
    });

    it('supports custom password fields', (done) => {
      let hook = {
        data: { custom: 'password' }
      };

      hashPassword({ passwordField: 'custom'})(hook).then(hook => {
        assert.ok(hook.data.custom);
        assert.notEqual(hook.data.custom, 'password');
        done();
      });
    });
  });
});