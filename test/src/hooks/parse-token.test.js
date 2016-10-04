import jwt from 'jsonwebtoken';
import { expect } from 'chai';
import { parseToken } from '../../../src/hooks';

describe('hooks:parseToken', () => {
  let hook;

  beforeEach(() => {
    hook = {
      type: 'before',
      params: {
        provider: 'rest'
      },
      app: {
        get: () => {}
      }
    };
  });

  describe('when not called as a before hook', () => {
    it('returns an error', () => {
      hook.type = 'after';
      return parseToken()(hook).catch(error => {
        expect(error).to.not.equal(undefined);
      });
    });
  });

  describe('when provider does not exist', () => {
    it('does not do anything', () => {
      delete hook.params.provider;
      return parseToken()(hook).then(returnedHook => {
        expect(hook).to.deep.equal(returnedHook);
      });
    });
  });

  describe('when token does not exist', () => {
    it('does not do anything', () => {
      return parseToken()(hook).then(returnedHook => {
        expect(hook).to.deep.equal(returnedHook);
      });
    });
  });

  describe('when token exists', () => {
    beforeEach(() => {
      const jwtOptions = {
        issuer: 'feathers',
        subject: 'auth',
        algorithm: 'HS256',
        expiresIn: '1d'
      };

      hook.app.get = () => {
       return { token: Object.assign({ secret: 'secret', name: 'token' }, jwtOptions) };
      };

      hook.params.token = jwt.sign({ id: 1 }, 'secret', jwtOptions);
    });

    describe('when secret is missing', () => {
      it('returns an error', () => {
        hook.app.get = () => {
         return { token: {} };
        };

        return parseToken()(hook).catch(error => {
          expect(error).to.not.equal(undefined);
        });
      });
    });

    describe('when secret is present', () => {
      describe('when token is invalid', () => {
        it('flags hook as unauthenticated', () => {    
          hook.params.token = 'invalid';
          return parseToken()(hook).then(hook => {
            expect(hook.params.authenticated).to.equal(false);
          });
        });
      });

      describe('when token is valid', () => {
        describe('when options are not consistent', () => {
          it('flags hook as unauthenticated', () => {
            hook.params.token = jwt.sign({ id: 1 }, 'secret', { algorithm: 'HS384' });

            return parseToken()(hook).then(hook => {
              expect(hook.params.authenticated).to.equal(false);
            });
          });
        });

        describe('when options are pulled from global auth config', () => {
          it('flags hook as authenticated', () => {
            return parseToken()(hook).then(hook => {
              expect(hook.params.authenticated).to.equal(true);
            });
          });

          it('adds token payload to params', () => {
            return parseToken()(hook).then(hook => {
              expect(typeof hook.params.payload).to.equal('object');
              expect(hook.params.payload.id).to.equal(1);
            });
          });
        });

        describe('when options are passed in explicitly', () => {
          beforeEach(() => {
            const jwtOptions = {
              issuer: 'feathers',
              subject: 'password-reset',
              algorithm: 'HS256',
              expiresIn: '1d'
            };

            hook.params.custom = jwt.sign({ id: 1 }, 'secret', jwtOptions);
          });

          it('flags hook as authenticated', () => {
            return parseToken({ subject: 'password-reset', name: 'custom'})(hook).then(hook => {
              expect(hook.params.authenticated).to.equal(true);
            });
          });

          it('adds token payload to params', () => {
            return parseToken({ subject: 'password-reset', name: 'custom'})(hook).then(hook => {
              expect(typeof hook.params.payload).to.equal('object');
              expect(hook.params.payload.id).to.equal(1);
            });
          });
        });
      });
    });
  });
});