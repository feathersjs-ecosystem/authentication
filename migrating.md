# Migrating from 0.7 to 0.8

Feathers authentication has had a fairly major overhaul in order to support some functionality and scalability going forward. After usage by ourselves and others we realized that there were some limitations in previous the architecture. These new changes allow for some pretty awesome functionality and flexibility.

## New Features and Additions

### More warnings and debugging

We've added more helpful warning messages and added debug logs for every hook, service, and middleware.

#### Turning on all auth logs
You can turn on all auth debug logs by running your app with `DEBUG=feathers-authentication* npm start`.

#### Turning on logs for a specific type
If you want to only turn on logs for a `hooks`, `middleware` or `services` you can do `DEBUG=feathers-authentication:<type>* npm start`. For example,

```
`DEBUG=feathers-authentication:hooks* npm start`
```

#### Turning on logs for a specific entity
If you want to only turn on logs for a specific hook, middleware or service you can do `DEBUG=feathers-authentication:<type>:<entity> npm start`. For example,

```
`DEBUG=feathers-authentication:hooks:isAuthenticated npm start`
```

### New Options

TODO (EK)

- `shouldSetupMiddleware` - by default, middleware for HTTP(s) and socket requests is set up for you automatically. If you need to alter the default middleware or order you will need to set this option to `false` and register the middleware yourself. You can see how it is registered [here]().

### Better Permissions Control (WIP)

We have introduced a new hook and new middleware called `hasPermissions`. This gives you more flexibility and better control over access permissions than was previously possible. Permissions are stored in the database on the entity record that needs to have access permissions checked (typically a user). They look like this:

```js
[
    '*', // all services, all methods, all docs
    'users:*', // all methods on users service
    'users:remove:*', // can remove any user
    '*:remove', // can remove on any service
    'users:remove:1234', // can only remove user with id 1234
    'users:*:1234', // can call any service method for user with id 1234
]
```

you use your hook like this:

```js
const auth = require('feathers-authentication').hooks;
userService.before({
    all: [
        auth.isAuthenticated(),
        auth.hasPermissions('users') // pass the name of the service/pre-fix you want to use
    ]
});
```

and the middleware like this:

```js
const mw = require('feathers-authentication').middleware;
const requiredPermissions = ['users:*', 'admin']; // whatever permissions you want
app.get('/protected', mw.hasPermissions(requiredPermissions), (req, res, next) => {
    // Do your thing
});
```

By default this new hook and new middleware assume you are storing your permissions on a `permissions` field either as an array of strings or a string with comma separated permissions. As always, you can customize the field you are storing your permissions under so you can still use the old role based system by doing this:

```js
const auth = require('feathers-authentication').hooks;
userService.before({
    all: [
        auth.isAuthenticated(),
        auth.hasPermissions('admin', { field: 'role'})
    ]
});
```

### More Flexible Tokens (WIP)

The token service has now been altered to be more generic. You can now generate different types of tokens other than JWT's. You can also generate different types of JWT's with different options separate from the standard auth token. This allows you to generate temporary access tokens for things like password reset or email confirmation or generate longer lived access tokens for things like IoT devices.

The service supports the following token types:

- `uuid`,
- `jwt` (default)

You can specify the type of token during a `create` call by setting `hook.params.tokenOptions.type = 'uuid'`.

Here is an example of how you might generate a temporary JWT:

```js
const payload = {
    // whatever you want to put in the token
};

const params = {
    tokenOptions: {
        type: 'jwt',
        options: {
            audience: 'user',
            subject: 'password-reset',
            expiresIn: '5m'
        }
    }
}

app.service('auth/token').create(payload, params).then(token => {
    // Do your thing
})
.catch(error => {
    // Handle errors
});
```

## Server Side Rendering

You can now create "Universal" apps or the more old school server side templated apps **with** stateless JWT authentication. In order to support server side rendering the client will now automatically attempt to authenticate if a token is present without you needing to call `app.authenticate` explicitly each time.

For servers that are using a template engine to render their views server side (ie. Jade, Handlebars, etc) you may not be using client side JS for your authentication. So we now support using your JWT more like a traditional session. It's still stateless but the JWT is stored in a cookie.

## Logged In/Logged Out State
It wasn't possible to know accurately when a user was logged in or out. We've fixed that! You can now access the user at any point in your application . In addition, **you no longer need to add the `verifyToken` and `populateUser` hooks to your services** because they are already loaded earlier on in the data flow.

### Using Sockets

Using sockets you can now listen for the `login` and `logout` events. This is accomplished by doing:

```js
app.on('login', function(data) {
  console.log('User logged in', data);
});

app.on('logout', function(data) {
  console.log('User logged out', data);
});

// or on a specific socket

socket.on('login', function(data) {
  console.log('User logged in', data);
});

socket.on('logout', function(data) {
  console.log('User logged out', data);
});

```

### Using REST
If a request came in over HTTP(S) the user is now being populated and authenticated in middleware on every request.

#### In Middleware
If you need this information in a custom route or other middleware you can access the current user and whether they are authenticated by inspecting `req.authenticated` and `req.user`.

### In Hooks/Services
If you need this information in a hook or service you can access the current user and whether they are authenticated by inspecting `hook.params.user` and `hook.params.authenticated`.

## Breaking Changes

### You must configure all services explicitly
Your JSON config files for your app no longer magically determine which authentication services are initialized. You now need to configure them explicitly.

Instead of:

```js
// feathers-authentication < v0.8.0
const authentication = require('feathers-authentication');
app.configure(authentication(options))
```
 
You now do:

```js
// feathers-authentication >= v0.8.0
const authentication = require('feathers-authentication');
const token = authentication.TokenService;
const local = authentication.LocalService;
const oauth2 = authentication.OAuth2Service;

app.configure(authentication(options))
    .configure(token(options))
    .configure(local(options))
    .configure(oauth2(options))
```

### You must configure register all middleware explicitly (WIP)

TODO

### You no longer register some hooks

You no longer need to add the `verifyToken` and `populateUser` hooks to your services. We are loading the user and checking tokens earlier in the data flow before it even gets to a service.

The old way:

```js
// feathers-authentication < v0.8.0
const auth = require('feathers-authentication').hooks;
messageService.before({
    all: [
        auth.verifyToken(),
        auth.populateUser()
    ]
});
```

The new way:

```js
// feathers-authentication >= v0.8.0
const auth = require('feathers-authentication').hooks;
messageService.before({
    all: []
});
```

Much better! :smile:

### Removed Options

TODO (EK)

We've changed up some of the possible authentication options.

- `cookie`

## Deprecations

We have deprecated some of the authentication hooks, specifically around authorization permissions. **They will be removed in v1.0**.

The following hooks have been deprecated:

- `restrictToOwner`
- `restrictToRoles`
- `verifyOrRestrict`
- `populateOrRestrict`
- `hasRoleOrRestrict`
- `restrictToAuthenticated` - It has been renamed to `isAuthenticated`. You should use that going forward but we will keep the old hook around until v1.0.0.

You should now use the single `hasPermissions` hook (or middleware) as defined above.