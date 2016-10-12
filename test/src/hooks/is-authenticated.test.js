import errors from 'feathers-errors';
import { expect } from 'chai';
import { isAuthenticated } from '../../../src/hooks';

describe('hooks:isAuthenticated', () => {
  let hook;

  beforeEach(() => {
    hook = {
      type: 'before',
      params: {
        provider: 'rest'
      }
    };
  });

  describe('when not called as a before hook', () => {
    it('returns an error', () => {
      hook.type = 'after';

      return isAuthenticated()(hook).catch(error => {
        expect(error).to.not.equal(undefined);  
      });
    });
  });

  describe('when provider does not exist', () => {
    it('does nothing', () => {
      delete hook.params.provider;

      return isAuthenticated()(hook).then(returnedHook => {
        expect(returnedHook).to.deep.equal(hook);
      });
    });
  });

  describe('when provider exists', () => {
    describe('when authenticated', () => {
      it('does nothing', () => {
        hook.params.authenticated = true;

        return isAuthenticated()(hook).then(returnedHook => {
          expect(returnedHook).to.deep.equal(hook);
        });
      });
    });

    describe('when not authenticated', () => {
      it('returns an error', () => {
        return isAuthenticated()(hook).catch(error => {
          expect(error instanceof errors.NotAuthenticated).to.equal(true);
        });
      });
    });
  });
});