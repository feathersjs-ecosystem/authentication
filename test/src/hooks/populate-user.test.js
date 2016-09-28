import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { populateUser } from '../../../src/hooks';

chai.use(sinonChai);

const user = { name: 'Mary' };
const fn = sinon.stub().returns({ user: {} });
const mockGet = sinon.stub().returns(Promise.resolve(user));
const mockService = sinon.stub().returns({
  get: mockGet
});

describe('hooks:populateUser', () => {
  describe('when user id is missing', () => {
    it('does not do anything', done => {
      let hook = {
        params: {},
        app: {
          get: fn
        }
      };

      populateUser()(hook).then(returnedHook => {
        expect(hook).to.deep.equal(returnedHook);
        done();
      }).catch(done);
    });
  });

  describe('when used as an after hook', () => {
    let hook;

    beforeEach(() => {
      hook = {
        type: 'after',
        params: {},
        result: {},
        app: {
          get: fn,
          service: mockService
        }
      };
    });

    describe('when using default options', () => {
      beforeEach(() => {
        hook.result._id = '1';
      });

      it('calls service with correct userEndpoint', () => {
        return populateUser()(hook).then(() => {
          expect(mockService).to.be.calledWith('/users');
        });
      });

      it('calls get with correct id', () => {
        return populateUser()(hook).then(() => {
          expect(mockGet).to.be.calledWith('1');
        });
      });

      it('adds the user to params', () => {
        return populateUser()(hook).then(hook => {
          expect(hook.params.user).to.deep.equal(user);
        });
      });

      it('adds the user to result.user', () => {
        return populateUser()(hook).then(hook => {
          expect(hook.result.user).to.deep.equal(user);
        });
      });

      it('removes the id from the result object root', () => {
        return populateUser()(hook).then(hook => {
          expect(hook.result._id).to.equal(undefined);
        });
      });
    });

    describe('when using options from global auth config', () => {
      beforeEach(() => {
        hook.result.id = '2';
        hook.app.get = function() {
          return {
            user: { idField: 'id', service: 'api/users' }
          };
        };
      });

      it('calls service with correct endpoint', () => {
        return populateUser()(hook).then(() => {
          expect(mockService).to.be.calledWith('api/users');
        });
      });

      it('calls get with correct id', () => {
        return populateUser()(hook).then(() => {
          expect(mockGet).to.be.calledWith('2');
        });
      });

      it('adds the user to params', () => {
        return populateUser()(hook).then(hook => {
          expect(hook.params.user).to.deep.equal(user);
        });
      });

      it('adds the user to result.user', () => {
        return populateUser()(hook).then(hook => {
          expect(hook.result.user).to.deep.equal(user);
        });
      });

      it('removes the id from the result object root', () => {
        return populateUser()(hook).then(hook => {
          expect(hook.result.id).to.equal(undefined);
        });
      });
    });

    describe('when using custom options', () => {
      let options;

      beforeEach(() => {
        hook.result.id = '2';
        options = { idField: 'id', service: 'api/users' };
      });

      it('calls service with correct endpoint', () => {
        return populateUser(options)(hook).then(() => {
          expect(mockService).to.be.calledWith('api/users');
        });
      });

      it('calls get with correct id', () => {
        return populateUser(options)(hook).then(() => {
          expect(mockGet).to.be.calledWith('2');
        });
      });

      it('adds the user to params', () => {
        return populateUser(options)(hook).then(hook => {
          expect(hook.params.user).to.deep.equal(user);
        });
      });

      it('adds the user to result.user', () => {
        return populateUser(options)(hook).then(hook => {
          expect(hook.result.user).to.deep.equal(user);
        });
      });

      it('removes the id from the result object root', () => {
        return populateUser(options)(hook).then(hook => {
          expect(hook.result.id).to.equal(undefined);
        });
      });
    });
  });
});