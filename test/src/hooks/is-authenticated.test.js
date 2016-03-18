import assert from 'assert';
import { isAuthenticated } from '../../../src/hooks';

describe('isAuthenticated', () => {
  describe('when user exists', () => {
    it('does not throw an error', () => {
      let hook = {
        params: {
          user: 'Joe Rogan'
        }
      };

      try {
        isAuthenticated()(hook);
        assert.ok(true);
      }
      catch(error) {
        // It should never get here
        assert.ok(false);
      }

    });
  });

  describe('when user does not exist', () => {
    describe('when provider exists', () => {
      it('throws a not authenticated error', () => {
        let hook = {
          params: {
            provider: 'rest'
          }
        };

        try {
          hook = isAuthenticated()(hook);
        }
        catch (error) {
          assert.equal(error.code, 401);
        }
      });
    });

    describe('when provider does not exist', () => {
      it('does not throw an error', () => {
        let hook = {
          params: {}
        };

        try {
          isAuthenticated()(hook);
          assert.ok(true);
        }
        catch(error) {
          // It should never get here
          assert.ok(false);
        }
      });
    });
  });
});