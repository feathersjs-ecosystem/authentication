import feathers from 'feathers';
import primus from 'feathers-primus';
import socketio from 'feathers-socketio';
import rest from 'feathers-rest';
import feathersHooks from 'feathers-hooks';
import authentication from '../src/';
import {hooks} from '../src/';
import bodyParser from 'body-parser';
import memory from 'feathers-memory';
import async from 'async';

export default function(settings, username, password, useSocketio, next) {

  const app = feathers();

  app.configure(rest())
    .configure(useSocketio ? socketio() : primus({ transformer: 'websockets' }))
    .configure(feathersHooks())
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .configure(authentication(settings))
    .use('/users', memory({
      startId: 1
    }))
    .use('/messages', memory())
    .use('/', feathers.static(__dirname))
    /*jshint unused: false*/
    .use(function(error, req, res, next){
      res.status(error.code);
      res.json(error);
    });

  let server = app.listen(8888);

  let userService = app.service('/users');
  userService.before({
    create: [hooks.hashPassword()]
  });


  // Messages will require auth.
  let messageService = app.service('/messages');

  server.on('listening', () => {
    async.series([
      function(cb){
        userService.create({email: username, password: password}, {}, cb);
      },
      function(cb){
        messageService.create({text: 'A million people walk into a Silicon Valley bar'}, {}, function(){});
        messageService.create({text: 'Nobody buys anything'}, {}, function(){});
        messageService.create({text: 'Bar declared massive success'}, {}, cb);
      }
    ], function(){
      messageService.before({
        all: [
          hooks.verifyToken({ secret: settings.token.secret }),
          hooks.populateUser(),
          hooks.requireAuth()
        ]
      });
      
      next(null, { app, server });
    });

  });
}
