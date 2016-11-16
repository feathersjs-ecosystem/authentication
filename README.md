# feathers-authentication

[![Build Status](https://travis-ci.org/feathersjs/feathers-authentication.png?branch=master)](https://travis-ci.org/feathersjs/feathers-authentication)
[![Code Climate](https://codeclimate.com/github/feathersjs/feathers-authentication.png)](https://codeclimate.com/github/feathersjs/feathers-authentication)
[![Test Coverage](https://codeclimate.com/github/feathersjs/feathers-authentication/badges/coverage.svg)](https://codeclimate.com/github/feathersjs/feathers-authentication/coverage)
[![Dependency Status](https://img.shields.io/david/feathersjs/feathers-authentication.svg?style=flat-square)](https://david-dm.org/feathersjs/feathers-authentication)
[![Download Status](https://img.shields.io/npm/dm/feathers-authentication.svg?style=flat-square)](https://www.npmjs.com/package/feathers-authentication)
[![Slack Status](http://slack.feathersjs.com/badge.svg)](http://slack.feathersjs.com)

> Add Authentication to your FeathersJS app.

`feathers-authentication` adds shared [PassportJS](http://passportjs.org/) authentication for Feathers HTTP REST and WebSockets transports using [JSON Web Tokens](http://jwt.io/).


## Installation

```
npm install feathers-authentication --save
```

## Documentation

Please refer to the [Authentication documentation](http://docs.feathersjs.com/authentication/readme.html) for more details.

### Complementary Plugins

The following plugins are complementary but entirely optional:

- [feathers-authentication-client](https://github.com/feathersjs/feathers-authentication-client)
- [feathers-authentication-local](https://github.com/feathersjs/feathers-authentication-local)
- [feathers-authentication-jwt](https://github.com/feathersjs/feathers-authentication-jwt)
- [feathers-authentication-oauth1](https://github.com/feathersjs/feathers-authentication-oauth1)
- [feathers-authentication-oauth2](https://github.com/feathersjs/feathers-authentication-oauth2)
- [feathers-permissions](https://github.com/feathersjs/feathers-permissions)

## Migrating to 1.0
Refer to [the migration guide](./docs/migrating.md).

## Complete Example
Here's an example of a Feathers server that uses `feathers-authentication` for local auth.

**Note:** This does NOT implement any authorization. Use [feathers-permissions](https://github.com/feathersjs/feathers-permissions) for that.

```js
const feathers = require('feathers');
const rest = require('feathers-rest');
const socketio = require('feathers-socketio');
const hooks = require('feathers-hooks');
const memory = require('feathers-memory');
const bodyParser = require('body-parser');
const errors = require('feathers-errors');
const errorHandler = require('feathers-errors/handler');
const local = require('feathers-authentication-local');
const jwt = require('feathers-authentication-jwt');
const auth = require('feathers-authentication');

const app = feathers();
app.configure(rest())
  .configure(socketio())
  .configure(hooks())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .configure(auth({ secret: 'supersecret' }))
  .configure(local())
  .configure(jwt())
  .use('/users', memory())
  .use('/', feathers.static(__dirname + '/public'))
  .use(errorHandler());

app.service('authentication').hooks({
  before: {
    create: [
      // You can chain multiple strategies
      auth.hooks.authenticate(['jwt', 'local']),
      customizeJWTPayload()
    ],
    remove: [
      auth.hooks.authenticate('jwt')
    ]
  }
});

// Add a hook to the user service that automatically replaces
// the password with a hash of the password before saving it.
app.service('users').hooks({
  before: {
    find: [
      auth.hooks.authenticate('jwt')
    ],
    create: [
      local.hooks.hashPassword({ passwordField: 'password' })
    ]
  }
});

let server = app.listen(3030);
server.on('listening', function() {
  console.log(`Feathers application started on localhost:${port}`);
});
```

## Client use

You can use the client in the Browser, in NodeJS and in React Native.

```js
import io from 'socket.io-client';
import feathers from 'feathers/client';
import hooks from 'feathers-hooks';
import socketio from 'feathers-socketio/client';
import localstorage from 'feathers-localstorage';
import authentication from 'feathers-authentication-client';

const socket = io('http://localhost:3030/');
const app = feathers()
  .configure(socketio(socket)) // you could use Primus or REST instead
  .configure(hooks())
  .configure(authentication({ storage: window.localStorage }));

app.authenticate({
  strategy: 'local',
  'email': 'admin@feathersjs.com',
  'password': 'admin'
}).then(function(result){
  console.log('Authenticated!', result);
}).catch(function(error){
  console.error('Error authenticating!', error);
});
```

## License

Copyright (c) 2016

Licensed under the [MIT license](LICENSE).
