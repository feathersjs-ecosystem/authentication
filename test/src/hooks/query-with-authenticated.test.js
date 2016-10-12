import { expect } from 'chai';
import { queryWithAuthenticated } from '../../../src/hooks';

describe('hooks:queryWithAuthenticated', () => {
  let hook = {
    type: 'before',
    app: {
      get: () => {}
    }
  };

  describe('when not called as a before hook', () => {
    it('returns an error', () => {
      hook.type = 'after';
      return queryWithAuthenticated()(hook).catch(error => {
        expect(error).to.not.equal(undefined);
      });
    });
  });

  describe('when user idField is missing', () => {
    it('returns an error', () => {
      return queryWithAuthenticated()(hook).catch(error => {
        expect(error).to.not.equal(undefined);
      });
    });
  });

  describe('when "as" is missing', () => {
    it('returns an error', () => {
      const options = {
        user: { idField: '_id' }
      };
      return queryWithAuthenticated(options)(hook).catch(error => {
        expect(error).to.not.equal(undefined);
      });
    });
  });

  describe('when "from" is missing', () => {
    it('returns an error', () => {
      const options = {
        user: { idField: '_id' },
        as: 'userId'
      };
      return queryWithAuthenticated(options)(hook).catch(error => {
        expect(error).to.not.equal(undefined);
      });
    });
  });

  describe('when user does not exist', () => {
    beforeEach(() => {
      hook = {
        type: 'before',
        params: {},
        app: {
          get: () => {
            return {
              user: { idField: '_id' },
              as: 'userId',
              from: 'user'
            };
          }
        }
      };
    });

    describe('when provider does not exist', () => {
      it('does nothing', () => {
        return queryWithAuthenticated()(hook).then(returnedHook => {
          expect(returnedHook).to.deep.equal(hook);
        });
      });
    });

    describe('when provider exists', () => {
      it('returns an error', () => {
        hook.params.provider = 'rest';

        return queryWithAuthenticated()(hook).catch(error => {
          expect(error).to.not.equal(undefined);
        });
      });
    });
  });

  describe('when user exists', () => {
    beforeEach(() => {
      hook = {
        type: 'before',
        params: {
          user: { _id: '1' },
          query: { text: 'Hi' }
        },
        app: {
          get: () => {
            return {
              user: { idField: '_id' },
              as: 'userId',
              from: 'user'
            };
          }
        }
      };
    });

    describe('when user is missing idField', () => {
      it('returns an error', () => {
        delete hook.params.user._id;

        return queryWithAuthenticated()(hook).catch(error => {
          expect(error).to.not.equal(undefined);  
        });
      });
    });

    it('adds user id to query using options from global auth config', () => {
      return queryWithAuthenticated()(hook).then(hook => {
        expect(hook.params.query.userId).to.equal('1');
      });
    });

    it('adds user id to query using custom options', () => {
      hook.params.user.id = '2';
      const options = { user: { idField: 'id' }, as: 'customId' };
      
      return queryWithAuthenticated(options)(hook).then(hook => {
        expect(hook.params.query.customId).to.equal('2');
      });
    });
  });
});