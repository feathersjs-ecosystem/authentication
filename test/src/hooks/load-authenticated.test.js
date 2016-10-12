import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { loadAuthenticated } from '../../../src/hooks';

chai.use(sinonChai);

const user = { name: 'Mary' };
const device = { id: '2', serial: '1234' };
const fn = sinon.stub().returns({
  user: {
    service: '/users',
    idField: '_id'
  }
});
const mockUserGet = sinon.stub().returns(Promise.resolve(user));
const mockDeviceGet = sinon.stub().returns(Promise.resolve(device));
const mockUserService = sinon.stub().returns({
  get: mockUserGet
});
const mockDeviceService = sinon.stub().returns({
  get: mockDeviceGet
});

describe('hooks:loadAuthenticated', () => {
  let hook;

  beforeEach(() => {
    hook = {
      type: 'after',
      params: {},
      result: {},
      app: {
        get: fn,
        service: mockUserService
      }
    };
  });

  describe('when to is missing', () => {
    it('returns an error', () => {
      hook.app.get = () => {};
      return loadAuthenticated()(hook).catch(error => {
        expect(error).to.not.equal(undefined);
      });
    });
  });

  describe('when idField is missing', () => {
    it('returns an error', () => {
      hook.app.get = () => {};
      return loadAuthenticated({ to: 'user' })(hook).catch(error => {
        expect(error).to.not.equal(undefined);
      });
    });
  });

  describe('when service is missing', () => {
    it('returns an error', () => {
      hook.app.get = () => {};
      return loadAuthenticated({ to: 'user', idField: '_id' })(hook).catch(error => {
        expect(error).to.not.equal(undefined);
      });
    });
  });

  describe('when id is missing', () => {
    it('does not do anything', () => {
      return loadAuthenticated()(hook).then(returnedHook => {
        expect(hook).to.deep.equal(returnedHook);
      });
    });
  });

  describe('when used as a before hook', () => {
    beforeEach(() => {
      hook.type = 'before';
    });
    
    describe('when using options from global auth config and user service is present', () => {
      beforeEach(() => {
        hook.params.payload = { _id: '1' };
      });

      it('calls service with correct endpoint', () => {
        return loadAuthenticated()(hook).then(() => {
          expect(mockUserService).to.be.calledWith('/users');
        });
      });

      it('calls get with correct id', () => {
        return loadAuthenticated()(hook).then(() => {
          expect(mockUserGet).to.be.calledWith('1');
        });
      });

      it('adds the user to params', () => {
        return loadAuthenticated()(hook).then(hook => {
          expect(hook.params.user).to.deep.equal(user);
        });
      });
    });

    describe('when using custom options', () => {
      let options;

      beforeEach(() => {
        hook.params.payload = { id: '2' };
        hook.app.service = mockDeviceService;
        options = { idField: 'id', service: 'api/devices', to: 'device' };
      });

      it('calls service with correct endpoint', () => {
        return loadAuthenticated(options)(hook).then(() => {
          expect(mockDeviceService).to.be.calledWith('api/devices');
        });
      });

      it('calls get with correct id', () => {
        return loadAuthenticated(options)(hook).then(() => {
          expect(mockDeviceGet).to.be.calledWith('2');
        });
      });

      it('adds the device to params', () => {
        return loadAuthenticated(options)(hook).then(hook => {
          expect(hook.params.device).to.deep.equal(device);
        });
      });
    });
  });

  describe('when used as an after hook', () => {
    describe('when using options from global auth config and user service is present', () => {
      beforeEach(() => {
        hook.result._id = '1';
      });

      it('calls service with correct endpoint', () => {
        return loadAuthenticated()(hook).then(() => {
          expect(mockUserService).to.be.calledWith('/users');
        });
      });

      it('calls get with correct id', () => {
        return loadAuthenticated()(hook).then(() => {
          expect(mockUserGet).to.be.calledWith('1');
        });
      });

      it('adds the user to params', () => {
        return loadAuthenticated()(hook).then(hook => {
          expect(hook.params.user).to.deep.equal(user);
        });
      });

      it('adds the user to result.user', () => {
        return loadAuthenticated()(hook).then(hook => {
          expect(hook.result.user).to.deep.equal(user);
        });
      });

      it('removes the id from the result object root', () => {
        return loadAuthenticated()(hook).then(hook => {
          expect(hook.result._id).to.equal(undefined);
        });
      });
    });

    describe('when using custom options', () => {
      let options;

      beforeEach(() => {
        hook.result.id = '2';
        hook.app.service = mockDeviceService;
        options = { idField: 'id', service: 'api/devices', to: 'device' };
      });

      it('calls service with correct endpoint', () => {
        return loadAuthenticated(options)(hook).then(() => {
          expect(mockDeviceService).to.be.calledWith('api/devices');
        });
      });

      it('calls get with correct id', () => {
        return loadAuthenticated(options)(hook).then(() => {
          expect(mockDeviceGet).to.be.calledWith('2');
        });
      });

      it('adds the device to params', () => {
        return loadAuthenticated(options)(hook).then(hook => {
          expect(hook.params.device).to.deep.equal(device);
        });
      });

      it('adds the device to result.device', () => {
        return loadAuthenticated(options)(hook).then(hook => {
          expect(hook.result.device).to.deep.equal(device);
        });
      });

      it('removes the id from the result object root', () => {
        return loadAuthenticated(options)(hook).then(hook => {
          expect(hook.result.id).to.equal(undefined);
        });
      });
    });
  });
});