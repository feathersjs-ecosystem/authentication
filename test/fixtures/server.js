import feathers from 'feathers';
import rest from 'feathers-rest';
import socketio from 'feathers-socketio';
import primus from 'feathers-primus';
import hooks from 'feathers-hooks';
import memory from 'feathers-memory';
import bodyParser from 'body-parser';
import errors from 'feathers-errors';
import errorHandler from 'feathers-errors/handler';
import auth from '../../lib/index';
import local from './local';
import jwt from './jwt';

const User = {
  email: 'admin@feathersjs.com',
  password: 'admin',
  permissions: ['*']
};

export default function(settings, useSocketio = true) {
  const app = feathers();

  app.configure(rest())
    .configure(useSocketio ? socketio() : primus({
      transformer: 'websockets'
    }))
    .configure(hooks())
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .configure(auth(settings))
    .configure(local)
    .configure(jwt)
    .use('/users', memory())
    .use('/', feathers.static(__dirname + '/public'))
    .use(errorHandler());  

  app.service('authentication').hooks({
    before: {
      create: [
        auth.hooks.authenticate('local', { session: false }),
        // auth.hooks.createJWT()
      ]
    }
  });

  // Add a hook to the user service that automatically replaces
  // the password with a hash of the password before saving it.
  app.service('users').hooks({
    before: {
      get: [
        auth.hooks.authenticate('jwt', { session: false })
      ],
      create: auth.hooks.hashPassword()
    }
  });

  // Create a user that we can use to log in
  app.service('users').create(User).catch(console.error);

  return app;
}
