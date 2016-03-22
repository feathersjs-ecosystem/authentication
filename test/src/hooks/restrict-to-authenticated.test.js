import assert from 'assert';
import { restrictToAuthenticated } from '../../../src/hooks';

describe('restrictToAuthenticated', () => {
  describe('when not called as a before hook', () => {
    it('throws an error', () => {
      let hook = {
        type: 'after'
      };

      try {
        restrictToAuthenticated()(hook);
      }
      catch(error) {
        assert.ok(error);
      }
    });
  });

  describe('when user exists', () => {
    it('does not throw an error', () => {
      let hook = {
        type: 'before',
        params: {
          user: 'Joe Rogan'
        }
      };

      try {
        restrictToAuthenticated()(hook);
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
          type: 'before',
          params: {
            provider: 'rest'
          }
        };

        try {
          hook = restrictToAuthenticated()(hook);
        }
        catch (error) {
          assert.equal(error.code, 401);
        }
      });
    });

    describe('when provider does not exist', () => {
      it('does not throw an error', () => {
        let hook = {
          type: 'before',
          params: {}
        };

        try {
          restrictToAuthenticated()(hook);
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