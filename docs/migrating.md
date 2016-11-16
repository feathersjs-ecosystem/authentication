# Migrating to 1.0

Feathers authentication has had a major overhaul in order to bring some much needed functionality, customization, and scalability going forward while also making it less complex. It is now simply an adapter over top of [Passport](http://passportjs.org/).

After usage by ourselves and others we realized that there were some limitations in previous the architecture. These new changes allow for some pretty awesome functionality and flexibility that are outlined in [New 1.0 Features](./new-1.0-features.md).

We've also decoupled the authentication strategies and permissions from the core authentication. While many apps needs these, not **every** app does. This has also allowed us to better test each piece in isolation.

They are now located here:

- [feathers-authentication-client](https://github.com/feathersjs/feathers-authentication-client)
- [feathers-authentication-local](https://github.com/feathersjs/feathers-authentication-local)
- [feathers-authentication-jwt](https://github.com/feathersjs/feathers-authentication-jwt)
- [feathers-authentication-oauth1](https://github.com/feathersjs/feathers-authentication-oauth1)
- [feathers-authentication-oauth2](https://github.com/feathersjs/feathers-authentication-oauth2)
- [feathers-permissions](https://github.com/feathersjs/feathers-permissions)

For most of you, migrating your app should be fairly straight forward as there are only a couple breaking changes to the public interface.

---

# Breaking Changes

## Setting up authentication on the server

**The Old Way (< v0.8.0)**

```js
// feathers-authentication < v0.8.0
const authentication = require('feathers-authentication');
app.configure(authentication(config))
    .use('/users', memory()) // this use to be okay to be anywhere
```

**The New Way**

```js
// feathers-authentication >= v1.0.0
const authentication = require('feathers-authentication');
const local = require('feathers-authentication-local');
const jwt = require('feathers-authentication-jwt');
const oauth1 = require('feathers-authentication-oauth1');
const oauth2 = require('feathers-authentication-oauth2');

// The services you are setting the `entity` param for need to be registered before authentication
app.use('/users', memory())
    .configure(authentication(config))
    .configure(jwt(config))
    .configure(local(config))
    .configure(oauth1(config))
    .configure(oauth2(config))
```

### Config Options

There are a number of breaking changes since the services have been removed:

- Change `auth.token` -> `auth.jwt` in your config
- Move `auth.token.secret` -> `auth.secret`
- `auth.token.payload` option has been removed. See [customizing JWT payload]() for how to do this.
- `auth.idField` has been removed. It is now included in all services so we can pull it internally without you needing to specify it.
- `auth.shouldSetupSuccessRoute` has been removed. Success redirect middleware is registered automatically but only triggers if you explicitly set a redirect. [See redirecting]() for more details.
- `auth.shouldSetupFailureRoute` has been removed. Failure redirect middleware is registered automatically but only triggers if you explicitly set a redirect. [See redirecting]() for more details.
- `auth.tokenEndpoint` has been removed. There isn't a token service anymore.
- `auth.localEndpoint` has been removed. There isn't a local service anymore. It is a passport plugin and has turned into `feathers-authentication-local`.
- `auth.userEndpoint` has been removed. It is now part of `feathers-authentication-local` and is `auth.local.service`.
- Cookies are now disabled by default. If you need cookie support (ie. OAuth, Server Side Rendering, Redirection) then you need to explicitly enable it by setting `auth.cookie.enable = true`.

## Setting up authentication on the client

Authenticating through the Feathers client is almost exactly the same with just a few keys changes:

- `type` is now `strategy` when calling `authenticate()` and must be an exact name match of one of your strategies registered server side.
- You must fetch your user explicitly (typically after authentication succeeds)
- You require `feathers-authentication-client` instead of `feathers-authentication/client`

**The Old Way (< v0.8.0)**

```js
// feathers-authentication < v0.8.0
const authentication = require('feathers-authentication/client');
app.configure(authentication());

app.authenticate({
  type: 'local',
  email: 'admin@feathersjs.com',
  password: 'admin'
}).then(function(result){
  console.log('Authenticated!', result);
}).catch(function(error){
  console.error('Error authenticating!', error);
});
```

**The New Way (with `feathers-authentication-client`)**

```js
// feathers-authentication-client >= v1.0.0
const authentication = require('feathers-authentication-client');
app.configure(authentication(config));

app.authenticate({
  strategy: 'local',
  email: 'admin@feathersjs.com',
  password: 'admin'
}).then(function(result){
  console.log('Authenticated!', result);

  return app.service('users').get(result.payload.id).then(user => {
    app.set('user', user);
  });
}).catch(function(error){
  console.error('Error authenticating!', error);
});
```

### Config Options

- `localEndpoint` has been removed. There is just one endpoint called `service` which defaults to `/authentication`.
- `tokenEndpoint` has been removed. There is just one endpoint called `service` which defaults to `/authentication`.
- `tokenKey` -> `accessTokenKey`


## Response to `app.authenticate()` does not return `user`

We previously made the poor assumption that you are always authenticating a user. This is not always be the case, or your app may not care about the current user as you have their id or can encode some details in the JWT.  Therefore, if you need to get the current user you need to request it explicitly after authentication or populate it yourself in an after hook.

### Fetching User Explicitly

TODO

### Populating User Explicitly

TODO

## JWT Parsing

The JWT is only parsed from the header by default now. It is no longer pulled from the body or query string.

You can customize the header by passing the `app.configure(authentication({header: 'custom'})`. If you want to customize things further you can refer to the [`feathers-authentication-jwt`](https://github.com/feathersjs/feathers-authentication-jwt) module or implement your own custom passport JWT strategy.

## Hook Changes

### Hooks always return promises

This shouldn't really affect you unless you are testing, modifying or wrapping existing hooks but they **always** return promises now. This makes the interface more consistent, making it easier to test and reason as to what a hook does.

### Removed Hooks

We have removed all of the old authentication hooks. If you still need these they have been moved to the [feathers-legacy-authentication-hooks](https://github.com/feathersjs/feathers-legacy-authentication-hooks) repo and are deprecated.

The following hooks have been removed:

- `associateCurrentUser` -> left to developer
- `queryWithCurrentUser` -> left to developer
- `restrictToOwner` -> use new `feathers-permissions` plugin
- `restrictToRoles` -> use new `feathers-permissions` plugin
- `verifyOrRestrict` -> use new `feathers-permissions` plugin
- `populateOrRestrict` -> use new `feathers-permissions` plugin
- `hasRoleOrRestrict` -> use new `feathers-permissions` plugin
- `restrictToAuthenticated` -> use new `feathers-permissions` plugin
- `hashPassword` -> has been moved to `feathers-authentication-local`
- `populateUser` -> use new `populate` hook in `feathers-hooks-common`
- `verifyToken` -> use new `feathers-authentication-jwt` plugin to easily validate a JWT access token. You can also now call `app.passport.verifyJWT` anywhere in your app to do it explicitly.

**We will no longer be supporting these** but have published them as `feathers-legacy-authentication-hooks` to ease migration. You are highly encouraged to migrate to the much more powerful and flexible [feathers-permissions](https://github.com/feathersjs/feathers-permissions) plugin.

**The Old Way (< v0.8.0)**

Typically you saw a lot of this in your hook definitions for a service:

```js
// feathers-authentication < v0.8.0
const auth = require('feathers-authentication').hooks;
exports.before = {
  all: [],
  find: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.queryWithCurrentUser()
  ],
  get: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToOwner({ ownerField: '_id' })
  ]
}
```

**The New Way**

```js
// feathers-authentication >= v1.0.0
const authentication = require('feathers-authentication');
const permissions = require('feathers-permissions');
exports.before = {
  all: [
    authentication.hooks.authenticate('jwt'),
    permissions.hooks.checkPermissions({service: 'users', on: 'user', field: 'permissions'}),
    permissions.hooks.isPermitted()
  ],
  find: [
    myCustomQueryWithCurrentUser() // instead of auth.queryWithCurrentUser()
  ]
}
```
