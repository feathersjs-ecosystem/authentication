/*jshint expr: true*/

import authentication, { middleware as mw } from '../../src';
import feathers from 'feathers';
import passport from 'passport';
import rest from 'feathers-rest';
import socketio from 'feathers-socketio';
import primus from 'feathers-primus';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

describe('Feathers Authentication', () => {
  it('is CommonJS compatible', () => {
    expect(typeof require('../../lib')).to.equal('function');
  });

  it('is ES6 compatible', () => {
    expect(typeof authentication).to.equal('function');
  });

  it('exposes hooks', () => {
    expect(typeof authentication.hooks).to.equal('object');
  });

  it('exposes middleware', () => {
    expect(typeof authentication.middleware).to.equal('object');
  });

  it('exposes LocalService', () => {
    expect(typeof authentication.LocalService).to.equal('function');
  });

  it('exposes TokenService', () => {
    expect(typeof authentication.TokenService).to.equal('function');
  });

  it('exposes OAuth2Service', () => {
    expect(typeof authentication.OAuth2Service).to.equal('function');
  });

  describe('config options', () => {
    it('throws an error when token secret is missing', () => {
      try {
        feathers().configure(authentication());
      }
      catch(error) {
        expect(error).to.not.equal(undefined);
      }
    });

    describe('default options', () => {
      let app;
      const options = {
        token: {
          secret: 'secret'
        }
      };

      beforeEach(() => {
        app = feathers().configure(authentication(options));
      });

      it('sets the header', () => {
        expect(app.get('auth').header).to.equal('Authorization');
      });

      it('sets setupMiddleware', () => {
        expect(app.get('auth').setupMiddleware).to.equal(true);
      });

      describe('cookie', () => {
        it('it is disabled', () => {
          expect(app.get('auth').cookie.enabled).to.equal(false);
        });

        it('sets the name to feathers-jwt', () => {
          expect(app.get('auth').cookie.name).to.equal('feathers-jwt');
        });

        it('makes the cookie as httpOnly', () => {
          expect(app.get('auth').cookie.httpOnly).to.equal(true);
        });

        it('sets the maxAge', () => {
          expect(app.get('auth').cookie.maxAge).to.equal('1d');
        });

        it('sets the cookie as secure', () => {
          expect(app.get('auth').cookie.secure).to.equal(true);
        });

        it('sets the cookie insecure in development', () => {
          app = feathers();
          app.env = 'development';
          app.configure(authentication(options));

          expect(app.get('auth').cookie.secure).to.equal(false);
        });

        it('sets the cookie insecure in test', () => {
          app = feathers();
          app.env = 'test';
          app.configure(authentication(options));

          expect(app.get('auth').cookie.secure).to.equal(false);
        });
      });

      describe('token', () => {
        it('sets the name', () => {
          expect(app.get('auth').token.name).to.equal('token');
        });

        it('sets the service', () => {
          expect(app.get('auth').token.service).to.equal('/auth/token');
        });

        it('sets the issuer', () => {
          expect(app.get('auth').token.issuer).to.equal('feathers');
        });

        it('sets the algorithm', () => {
          expect(app.get('auth').token.algorithm).to.equal('HS256');
        });

        it('sets the expiresIn', () => {
          expect(app.get('auth').token.expiresIn).to.equal('1d');
        });
      });

      describe('local', () => {
        it('sets the service', () => {
          expect(app.get('auth').local.service).to.equal('/auth/local');
        });
      });

      describe('user', () => {
        it('sets the service', () => {
          expect(app.get('auth').user.service).to.equal('/users');
        });

        it('sets the idField', () => {
          expect(app.get('auth').user.idField).to.equal('_id');
        });

        it('sets the usernameField', () => {
          expect(app.get('auth').user.usernameField).to.equal('email');
        });

        it('sets the passwordField', () => {
          expect(app.get('auth').user.passwordField).to.equal('password');
        });
      });
    });
  });

  describe('when custom options are passed', () => {
    let app;
    const options = {
      token: {
        secret: 'secret',
        custom: 'super custom'
      }
    };

    beforeEach(() => {
      app = feathers().configure(authentication(options));
    });

    it('sets custom option', () => {
      expect(app.get('auth').token.custom).to.equal('super custom');
    });

    it('retains other default options', () => {
      expect(app.get('auth').token.service).to.equal('/auth/token');
    });
  });

  it('registers passport middleware', () => {
    const options = {
      token: {
        secret: 'secret'
      }
    };

    sinon.spy(passport, 'initialize');
    feathers().configure(authentication(options));
    expect(passport.initialize).to.have.been.called;
    passport.initialize.restore();
  });

  describe('when setupMiddleware is true', () => {
    describe('when rest is configured', () => {
      let app;

      beforeEach(() => {
        sinon.spy(mw, 'exposeRequestResponse');
        sinon.spy(mw, 'tokenParser');
        sinon.spy(mw, 'verifyToken');
        sinon.spy(mw, 'populateUser');
        sinon.spy(mw, 'logout');
        sinon.spy(mw, 'cookieParser');

        const options = {
          token: {
            secret: 'secret'
          } 
        };

        app = feathers()
          .configure(rest())
          .configure(authentication(options));
      });

      afterEach(() => {
        mw.exposeRequestResponse.restore();
        mw.tokenParser.restore();
        mw.verifyToken.restore();
        mw.populateUser.restore();
        mw.logout.restore();
        mw.cookieParser.restore();
      });

      describe('when cookies are enabled', () => {
        beforeEach(() => {
          const options = {
            token: {
              secret: 'secret'
            },
            cookie: {
              enable: true
            }
          };

          app = feathers()
            .configure(rest())
            .configure(authentication(options));
        });

        it('registers cookieParser middleware', () => {
          expect(mw.cookieParser).to.have.been.calledBefore(mw.exposeRequestResponse);
        });
      });

      it('registers exposeRequestResponse middleware', () => {
        expect(mw.exposeRequestResponse).to.have.been.calledBefore(mw.tokenParser);
      });

      it('registers tokenParser middleware', () => {
        expect(mw.tokenParser).to.have.been.calledBefore(mw.verifyToken);
      });

      it('registers verifyToken middleware', () => {
        expect(mw.verifyToken).to.have.been.calledBefore(mw.populateUser);
      });

      it('registers populateUser middleware', () => {
        expect(mw.populateUser).to.have.been.calledBefore(mw.logout);
      });

      it('registers logout middleware', () => {
        expect(mw.logout).to.have.been.calledAfter(mw.populateUser);
      });
    });

    describe('when socketio is configured', () => {
      let app;

      beforeEach(() => {
        sinon.spy(mw, 'setupSocketIOAuthentication');

        const options = {
          token: {
            secret: 'secret'
          } 
        };

        app = feathers()
          .configure(socketio())
          .configure(authentication(options))
          .listen();
      });

      afterEach(() => {
        mw.setupSocketIOAuthentication.restore();
      });

      it('registers socketio middleware', () => {
        expect(mw.setupSocketIOAuthentication).to.have.been.called;
      });
    });

    describe('when primus is configured', () => {
      let app;

      beforeEach(() => {
        sinon.spy(mw, 'setupPrimusAuthentication');

        const options = {
          token: {
            secret: 'secret'
          } 
        };

        app = feathers()
          .configure(primus({ transformer: 'websockets' }))
          .configure(authentication(options))
          .listen();
      });

      afterEach(() => {
        mw.setupPrimusAuthentication.restore();
      });

      it('registers primus middleware', () => {
        expect(mw.setupPrimusAuthentication).to.have.been.called;
      });
    });
  });

  describe('when setupMiddleware is false', () => {
    let app;

    beforeEach(() => {
      sinon.spy(mw, 'exposeRequestResponse');
      sinon.spy(mw, 'tokenParser');
      sinon.spy(mw, 'verifyToken');
      sinon.spy(mw, 'populateUser');
      sinon.spy(mw, 'logout');
      sinon.spy(mw, 'cookieParser');
      sinon.spy(mw, 'setupSocketIOAuthentication');
      sinon.spy(mw, 'setupPrimusAuthentication');

      const options = {
        setupMiddleware: false,
        token: {
          secret: 'secret'
        } 
      };

      app = feathers()
        .configure(rest())
        .configure(socketio())
        .configure(primus())
        .configure(authentication(options))
        .listen();
    });

    afterEach(() => {
      mw.setupSocketIOAuthentication.restore();
      mw.setupPrimusAuthentication.restore();
      mw.exposeRequestResponse.restore();
      mw.tokenParser.restore();
      mw.verifyToken.restore();
      mw.populateUser.restore();
      mw.logout.restore();
      mw.cookieParser.restore();
    });

    it('does not register rest middleware', () => {
      expect(mw.setupSocketIOAuthentication).to.not.have.been.called;
      expect(mw.setupPrimusAuthentication).to.not.have.been.called;
      expect(mw.exposeRequestResponse).to.not.have.been.called;
      expect(mw.tokenParser).to.not.have.been.called;
      expect(mw.verifyToken).to.not.have.been.called;
      expect(mw.populateUser).to.not.have.been.called;
      expect(mw.logout).to.not.have.been.called;
      expect(mw.cookieParser).to.not.have.been.called;
    });

    it('does not register socketio middleware', () => {
      expect(mw.setupSocketIOAuthentication).to.not.have.been.called;
    });

    it('does not register primus middleware', () => {
      expect(mw.setupPrimusAuthentication).to.not.have.been.called;
    });
  });
});