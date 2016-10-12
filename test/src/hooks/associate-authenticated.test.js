import { expect } from 'chai';
import { associateAuthenticated } from '../../../src/hooks';

describe('hooks:associateAuthenticated', () => {
  let hook;

  beforeEach(() => {
    hook = {
      type: 'before',
      app: {
        get: () => {}
      }
    };
  });

  describe('when not called as a before hook', () => {
    it('returns an error', () => {
      hook.type = 'after';
      return associateAuthenticated()(hook).catch(error => {
        expect(error).to.not.equal(undefined);
      });
    });
  });

  describe('when user idField is missing', () => {
    it('returns an error', () => {
      return associateAuthenticated()(hook).catch(error => {
        expect(error).to.not.equal(undefined);
      });
    });
  });

  describe('when "as" is missing', () => {
    it('returns an error', () => {
      const options = {
        user: { idField: '_id' }
      };
      return associateAuthenticated(options)(hook).catch(error => {
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
      return associateAuthenticated(options)(hook).catch(error => {
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
        return associateAuthenticated()(hook).then(returnedHook => {
          expect(returnedHook).to.deep.equal(hook);
        });
      });
    });

    describe('when provider exists', () => {
      it('returns an error', () => {
        hook.params.provider = 'rest';

        return associateAuthenticated()(hook).catch(error => {
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
        data: {},
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

        return associateAuthenticated()(hook).catch(error => {
          expect(error).to.not.equal(undefined);  
        });
      });
    });

    describe('when hook.data is an array', () => {
      beforeEach(() => {
        hook.data = [{}, {}];
      });

      it('adds user id to hook.data using options from global auth config', () => {
        return associateAuthenticated()(hook).then(hook => {
          expect(hook.data[0].userId).to.equal('1');
          expect(hook.data[1].userId).to.equal('1');
        });
      });

      it('adds user id to hook.data using custom options', () => {
        hook.params.user.id = '2';
        const options = { user: { idField: 'id' }, as: 'customId' };
        
        return associateAuthenticated(options)(hook).then(hook => {
          expect(hook.data[0].customId).to.equal('2');
          expect(hook.data[1].customId).to.equal('2');
        });
      });
    });

    describe('when hook.data is singular', () => {
      it('adds user id to hook.data using options from global auth config', () => {
        return associateAuthenticated()(hook).then(hook => {
          expect(hook.data.userId).to.equal('1');
        });
      });

      it('adds user id to hook.data using custom options', () => {
        hook.params.user.id = '2';
        const options = { user: { idField: 'id' }, as: 'customId' };
        
        return associateAuthenticated(options)(hook).then(hook => {
          expect(hook.data.customId).to.equal('2');
        });
      });
    });
  });
});