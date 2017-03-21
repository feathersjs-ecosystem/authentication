import { ownerOrRestrictChanges } from '../../../src/hooks';

import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);

const mockPatch = sinon.stub().returns(Promise.resolve([{text: 'test', approved: true}]));
const mockGet = sinon.stub().returns(Promise.resolve({
  toJSON: function() {
    return {
      _id: '123',
      text: 'test',
      approved: true,
      userId: '1'
    };
  }
}));
const mockService = {
  patch: mockPatch
};

describe('ownerOrRestrictChanges', () => {
  describe('when not called as a before hook', () => {
    it('throws an error', () => {
      let hook = {
        type: 'after',
        method: 'patch'
      };

      try {
        ownerOrRestrictChanges()(hook);
      }
      catch(error) {
        expect(error).to.not.equal(undefined);
      }
    });
  });

  describe('when provider does not exist', () => {
    it('does not do anything', () => {
      let hook = {
        type: 'before',
        method: 'patch',
        id: '123',
        params: {}
      };

      try {
        var returnedHook = ownerOrRestrictChanges()(hook);
        expect(hook).to.deep.equal(returnedHook);
      }
      catch(error) {
        // It should never get here
        expect(false).to.equal(true);
      }
    });
  });

  describe('when hook.id is not set', () => {
    it('should throw an error', () => {
      let hook = {
        type: 'before',
        method: 'patch',
        params: {}
      };

      try {
        ownerOrRestrictChanges()(hook);
      } catch(error) {
        // It should never get here
        expect(error).to.not.equal(undefined);
      }
    });
  });

  describe('when the user is not authenticated', () => {
    it('should throw an error if restricted changes are attempted', () => {
      let hook = {
        method: 'patch',
        app: {
          service: mockService
        },
        data: {
          author: 'James',
          approved: false
        },
        id: '123',
        type: 'before',
        params: {
          provider: 'rest'
        }
      };

      try {
        ownerOrRestrictChanges({ restrictOn: ['approved'] })(hook);
      } catch(error) {
        expect(error).to.not.equal(undefined);
      }
    });

    it('should authorize unrestricted changes', () => {
      let hook = {
        method: 'patch',
        app: {
          service: mockService
        },
        data: {
          author: 'James',
          pizza: 5
        },
        id: '123',
        type: 'before',
        params: {
          provider: 'rest'
        }
      };

      try {
        ownerOrRestrictChanges({ restrictOn: ['approved'] })(hook);
      } catch(error) {
        expect(error).to.not.equal(undefined);
      }
    });
  });

  describe('when user is not the owner', (done) => {
    it('should throw an error if restricted changes are attempted', () => {
      let hook = {
        method: 'patch',
        app: {
          service: mockService,
          get: function() {
            return {};
          }
        },
        data: {
          author: 'James',
          approved: false,
          pizza: 'cheese'
        },
        id: '123',
        type: 'before',
        params: {
          user: { _id: '2' },
          provider: 'rest'
        }
      };

      ownerOrRestrictChanges({ restrictOn: ['approved', 'pizza'] }).call({ get: mockGet }, hook).then(function() {}, function(error) {
        expect(error).to.not.equal(undefined);
        done();
      });
    });
    it('should authorize unrestricted changes', (done) => {
      let hook = {
        method: 'patch',
        app: {
          service: mockService,
          get: function() {
            return {};
          }
        },
        data: {
          author: 'James',
          pizza: 'bacon'
        },
        id: '123',
        type: 'before',
        params: {
          user: { _id: '2' },
          provider: 'rest'
        }
      };

      ownerOrRestrictChanges({ restrictOn: ['approved'] }).call({ get: mockGet }, hook).then(function(response) {
        expect(response).to.deep.equal(hook);
        done();
      });
    });
  });

  describe('when user is the owner', () => {
    it('should authorize all changes', (done) => {
      let hook = {
        method: 'patch',
        app: {
          service: mockService,
          get: function() {
            return {};
          }
        },
        data: {
          author: 'James',
          approved: false,
          pizza: 'pepporoni'
        },
        id: '123',
        type: 'before',
        params: {
          user: { _id: '1' },
          provider: 'rest'
        }
      };

      ownerOrRestrictChanges({ restrictOn: ['approved', 'pizza'] }).call({ get: mockGet }, hook).then(function(response) {
        expect(response).to.deep.equal(hook);
        done();
      });
    });
  });

});
