#  Authentication Chain

The Authentication chain is a made up of special type hooks called "Verification Hooks" that allow you to run transport agnostic code to authorize a request. What this means is that no matter **how** things connect to your API, your authentication chain stays the same.

Since sockets are inherently stateful and HTTP(S) requests are not, this caused a lot of redundancy in the authentication plugin and was not very scalable. Now, you can simply add special verification hooks to your authentication chain which allows you to customize authentication however you need to. All you need to do is set `params.authenticated` to true or false throughout this chain and ensure that you are checking for this on your services, like so:

```js
const auth = require('feathers-authentication');
// An example user service
app.service('users').hooks({
  before: {
    all: [
      auth.hooks.authenticate(),
      auth.hooks.isAuthenticated()
    ],
    create: [
      auth.hooks.hashPassword()
    ]   
  }
});
```

The `.authenticate()` function triggers your verification chain, and `.isAuthenticated()` function checks for `hook.params.authenticated` and if it is falsy, returns a `NotAuthenticated` error.

## Example

Refer to [the main spec](./spec.md#usage) for full usage.

## Examples of Hooks

```js
function verifyClientId(params) {
    const app = this;

    // If verification has already failed in a previous
    // middleware just skip to save resources.
    if (params.authenticated === false) {
      return Promise.resolve(params);
    }

    // look up clientId
    return app.service('clients').get(params.payload.clientId).then(client => {
      params.authenticated = true;
      return Promise.resolve(params);  
    })
    .catch(error => {
      params.authenticated = false;
      return Promise.resolve(params);
    });
}
```

```js
function checkAuthorizationExpiration(params) {
    const app = this;
    
    if (params.authorization.expiry > Date.now()) {
      params.authenticated = false;
    }

    return Promise.resolve(params);
}
```