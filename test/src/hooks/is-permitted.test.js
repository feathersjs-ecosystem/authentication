import errors from 'feathers-errors';
import { expect } from 'chai';
import { isPermitted } from '../../../src/hooks';

describe('hooks:isPermitted', () => {
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

      return isPermitted()(hook).catch(error => {
        expect(error).to.not.equal(undefined);  
      });
    });
  });

  describe('when provider does not exist', () => {
    it('does nothing', () => {
      delete hook.params.provider;

      return isPermitted()(hook).then(returnedHook => {
        expect(returnedHook).to.deep.equal(hook);
      });
    });
  });

  describe('when provider exists', () => {
    describe('when permitted', () => {
      it('does nothing', () => {
        hook.params.permitted = true;

        return isPermitted()(hook).then(returnedHook => {
          expect(returnedHook).to.deep.equal(hook);
        });
      });
    });

    describe('when not permitted', () => {
      it('returns an error', () => {
        return isPermitted()(hook).catch(error => {
          expect(error instanceof errors.Forbidden).to.equal(true);
        });
      });
    });
  });
});