import feathers from 'feathers';
import primus from 'feathers-primus';
import socketio from 'feathers-socketio';
import rest from 'feathers-rest';
import errorHandler from 'feathers-errors/handler';
import hooks from 'feathers-hooks';
import bodyParser from 'body-parser';
import memory from 'feathers-memory';
import authentication from '../../src/';

export default function(settings, useSocketio = true) {
  const app = feathers();

  app.configure(rest())
    .configure(useSocketio ? socketio() : primus({
      transformer: 'websockets'
    }))
    .configure(hooks())
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({
      extended: true
    }))
    .configure(authentication(settings))
    .use('/users', memory())
    .use('/messages', memory())
    .use(errorHandler());


  app.service('authentication').before({
    create(hook) {
      if(hook.data.login === 'testing') {
        hook.params.authentication = 'test-auth';

        hook.data.payload = {
          userId: 0,
          authentication: 'test-auth'
        };
      }
    }
  });

  app.service('messages').before({
    all: [
      authentication.hooks.authenticate(),
      authentication.hooks.isAuthenticated()
    ]
  });

  app.service('/users').create({
    id: 0,
    name: 'Tester'
  });

  return app;
}
