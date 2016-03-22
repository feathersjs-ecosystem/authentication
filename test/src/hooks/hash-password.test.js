import assert from 'assert';
import { hashPassword } from '../../../src/hooks';

describe('hashPassword', () => {
  describe('when not called as a before hook', () => {
    it('throws an error', () => {
      let hook = {
        type: 'after'
      };

      try {
        hashPassword()(hook);
      }
      catch(error) {
        assert.ok(error);
      }
    });
  });

  describe('when hook.data does not exist', () => {
    it('does not do anything', () => {
      let hook = {
        type: 'before',
        foo: { password: 'password' },
        app: {
          get: function() { return {}; }
        }
      };

      hook = hashPassword()(hook);
      assert.equal(hook.data, undefined);
      assert.equal(hook.foo.password, 'password');
    });
  });

  describe('when hook.data exists', () => {
    let hook;

    beforeEach(() => {
      hook = {
        type: 'before',
        data: { password: 'secret' },
        app: {
          get: function() { return {}; }
        }
      };
    });

    it('hashes with default options', (done) => {
      hashPassword()(hook).then(hook => {
        assert.ok(hook.data.password);
        assert.notEqual(hook.data.password, 'secret');
        done();
      });
    });

    it('hashes with options from global auth config', (done) => {
      hook.data.pass = 'secret';
      hook.app.get = function() {
        return { passwordField: 'pass' };
      };

      hashPassword()(hook).then(hook => {
        assert.ok(hook.data.pass);
        assert.notEqual(hook.data.pass, 'secret');
        done();
      });
    });

    it('hashes with custom options', (done) => {
      hook.data.pass = 'secret';

      hashPassword({ passwordField: 'pass'})(hook).then(hook => {
        assert.ok(hook.data.pass);
        assert.notEqual(hook.data.pass, 'secret');
        done();
      });
    });
  });
});