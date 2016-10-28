/*
 * Initialize passport bindings for express, socketio, and primus.
 */

// import express from '../express';
import { socketio, primus } from '../socket';
import makeDebug from 'debug';

const debug = makeDebug('feathers-authentication:passport:initialize');

export default function initialize (options = {}) {
  const app = this;
  const _super = app.setup;

  debug('Initializing custom passport initialize', options);

  return function (passport) {    
    app.setup = function() {
      let result = _super.apply(this, arguments);

      // Socket.io middleware
      if (app.io) {
        debug('registering Socket.io authentication middleware');
        app.io.on('connection', socketio(app, options));
      }

      // Primus middleware
      if (app.primus) {
        debug('registering Primus authentication middleware');
        app.primus.on('connection', primus(app, options));
      }

      return result;
    };
  };
}