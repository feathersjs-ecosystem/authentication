# Authentication 1.0 Spec

Auth needed an overhaul because we assumed too much. Here is a the new proposal.

## Precursor

We've seen some a lot of miscommunication around JWT, so it is important to understand a couple things before diving into the spec.

JWT access tokens **cannot** be truly stateless unless you are okay with eventual consistency limited to the TTL of the tokens. Since JWTs are only invalidated if they are expired, tampered with, or malformed they cannot be explicitly revoked or expired early without checking a blacklist or whitelist (which requires storing state). So the JWTs themselves may be stateless but the complete validation of the consumer using them to request access to things is not.

Without storing some state and having to verify against it JWTs are not suitable for API keys, as is implied in [this article from Auth0](https://auth0.com/blog/using-json-web-tokens-as-api-keys/). A contrived example that showcases why (based off the linked Auth0 article):

> Permissions are encoded in the token payload. If the permissions are revoked prior to the access token expiration the client could still send the access token with the old permissions until the token expires. This would not be possible if you blacklisted the access token when permissions were altered, but that involves storing state somewhere because you can't just alter the JWT itself or issue a new token without re-authenticating because even if you could you can't trust the client to send the new token.

## Definitions

- `Client` - A browser, mobile device, IoT device, or other server that makes requests to the your authentication server.
- `Server` - Your server that authenticates entities, issues and verifies tokens.
- `ClientID` - A unique client identifier that is encoded in the payload of a JWT access token (ie. username).
- `ClientSecret` - A private key shared between a client and server (ie. password). **Can't be used on an insecure client. Keep this private!**
- `Entity` - A thing requesting API access (this could be a user, organization, device, etc.)
- `Authentication Provider` - A 3rd party authentication provider (ie. Facebook, Twitter, etc.). They could expect users to authenticate via OAuth1/1a/2, SAML, API Key, Username + Password, LDAP, etc.
- `Authorization` - A record in a datastore that is compared against to grant authorization. It has a unique ID, verification values and permissions/scopes that are granted.
- `Verification Value` - Something that is used alongside the `authorizationId` to verify access. These could be anything but typically would be an entity Id (ie. `userId`). In a multi-client scenario, you would also have a `clientId`.
- `Verification Hook` - A special type of hook in the authentication chain that is used to verify the request or socket.
- `Authentication Chain` - A special chain of verification hooks. [More details](./auth-chain.md)
- `Access token (JWT)` - A JWT that sent by the client in:
    - the message body on a Socket `authenticate` event; or
    - every HTTP request as an `Authorization` header.

    It is verified on every incoming request or socket message to ensure:

    - the token hasn't expired
    - the entity it is associated with still exists
    - the token hasn't been revoked

- `Refresh Token (JWT)` - A semi-secret JWT that can be used to request a new access token. It is sent by the client in:
    - the message body on a Socket `authenticate` event; or
    - a HTTP request in the `POST` body to `/authentication`.

    It is verified to ensure:

    - the token hasn't expired
    - the verification values are still true
    - the token hasn't been revoked
- `Permissions/Scopes` - A series of access permissions that are associated to an Authorization.
- `Cookie` - A browser header that contains a signed access token (JWT). Used for server side templated, universal apps, or headless browser clients (used similarly to a session). The only difference between this and an Authorization header is the server sets it after successful authentication. It is mainly meant for when you do not have JavaScript enabled on the client.

## Proposal
These are the proposed requirements, data model and payloads, as well as basic usage. There are more complex examples defined in the [examples folder](./examples/readme.md).

The gist is this:

> We need a stateless, transport agnostic way of authenticating requests and we need a way for people to authenticate with any authentication provider and customize the JWT access token payload.

Therefore, we've done 2 major things:

1. Allow you to register your own `before`, `create` hooks on an `/authentication` service so that you can authenticate a user any way you would like (email/password, oauth, saml, etc.) and customize the JWT payload of the access token that gets created by the authentication service.

2. Abstracted the verification of an authenticated socket message or a HTTP request to what we are calling an "Authentication Chain", comprised of special "Verification Hooks". All these hooks do is verify that an access token is valid **prior** to being passed on to a service (ie. users, messages, etc). These are generally, non-erroring hooks and they just set `hook.params.authenticated` to `true` or `false` based on whatever conditions you specify in your hooks. The service, if it needs to, then checks to see if `hook.params.authenticated` is `true`.

### Data Model
A User can have multiple clients. Each of which can be granted an authorization. Clients can have multiple authorizations. Each authorization record maps to a single access token or refresh token. 

```
User -> has many -> Clients -> has many -> Authorizations ->  has many -> Permissions
```

#### SQL
Example Authorizations Table:

| id | authorizationId                      | clientId                 | userId                   | permissions                                       | createdAt                | updatedAt                | revokedAt                |
|----|--------------------------------------|--------------------------|--------------------------|---------------------------------------------------|--------------------------|--------------------------|--------------------------|
| 1  | 3f1ba85c-4ad4-493d-a986-8124a76031c5 | 58100cb3116a7b2f8d00abcc | 58100cb9116a7b2f8d00abcd | 'users:create,users:*:58100cb9116a7b2f8d00abcd'   | 2016-10-26T01:55:21.903Z | 2016-10-26T01:55:21.903Z | 2016-10-26T01:55:21.903Z |

#### NoSQL

Example MongoDB Collection

```js
// authorizations collection
{
    _id: "58100d98116a7b2f8d00abce",
    authorizationId: "3f1ba85c-4ad4-493d-a986-8124a76031c5",
    clientId: "58100cb3116a7b2f8d00abcc",
    userId: "58100cb9116a7b2f8d00abcd",
    permissions: ['users:create', 'users:*:58100cb9116a7b2f8d00abcd'],
    createdAt: '2016-10-26T01:55:21.903Z',
    updatedAt: '2016-10-26T01:55:21.903Z',
    revokedAt: '2016-10-26T01:55:21.903Z'
}
```

**NOTE:** We are considering `userId` and `clientId` to be "verification values". There could be any arbitrary number of them and they are specific to an application but you would need at least one to associate the authorization to a user and/or client.

### JWT Access Token Payload
The access token payload **must** have an `authorizationId` but beyond that the token payload is customizable based on your application requirements. The token can have a very long TTL or very short depending on your app requirements. If it is long or indefinite, it essentially acts similar to an API key. If it is short it acts similar to a session.

```js
{
    authorizationId: "3f1ba85c-4ad4-493d-a986-8124a76031c5", // required
    clientId: "58100cb3116a7b2f8d00abcc", // optional
    userId: "58100cb9116a7b2f8d00abcd", // optional - You could have more including organization, etc.
}
```

### JWT Refresh Token Payload
The refresh token payload **must** have an `authorizationId` but beyond that the token payload is customizable based on your application requirements. It should have a long TTL and be a one time use token.

```js
{
    refreshId: "3f1ba85c-4ad4-493d-a986-8124a76031c5", // required
    clientId: "58100cb3116a7b2f8d00abcc", // optional
    userId: "58100cb9116a7b2f8d00abcd" // optional - You could have more including organization, etc.
}
```

### Response from Authentication Service
This will be the default response from the Authentication service upon successful creation. Like any service you can add `after` hooks to do things like populate the current user, etc.

**Note:** We should make refresh token support optional 

```json
{
  "accessToken": "afsdsgsdfgdd",
  "refreshToken": "sfhgsdhfghsf",
}
```

### General Data Flow

See the [flows.md](./flows.md).

## Usage

### Server
```js
const feathers = require('feathers');
const rest = require('feathers-rest');
const socketio = require('socketio');
const hooks = require('feathers-hooks');
const commonHooks = require('feathers-hooks-common');
const auth = require('feathers-authentication');
const permissions = require('feathers-permissions');
const memory = require('feathers-memory');
const bodyParser = require('body-parser');
const configuration = require('feathers-configuration');

const app = feathers();

app.configure(configuration(path.join(__dirname, '..')))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .configure(hooks())
  .configure(rest())
  .configure(socketio())
  .configure(auth())
  .use('/users', memory())
  .use('/authorizations', memory())
  .use(errorHandler());

// Auth specific middleware
app.authentication.use(
  verifyJWT(),
  populateAuthorization(),
  verifyClientId(),
  // any other verification middleware
);

app.service('authentication').hooks({
  before: {
    create: [
      auth.hooks.local({
        clientIdField: 'email',
        clientSecretField: 'password',
        entity: 'user',
        service: 'users'
      }),
      revokeOldAuthorizations(),
      createAuthorization(),
      setupPayload()
    ]
  },
  before: {
    after: [
      commonHooks.populate({
        entity: 'user',
        service: 'users',
        on: 'result' // could be 'data', 'params', or 'result'
      })
    ]
  }
});

// Service Hooks
app.service('users').hooks({
  before: {
    all: [
      auth.hooks.authenticate(),
      auth.hooks.isAuthenticated(),
      permissions.hooks.checkPermissions({ service: 'users', on: 'payload', field: 'permissions' }),
      permissions.hooks.checkPermissions({ group: 'admin', on: 'myCustomPayload', field: 'groups' }),
      permissions.hooks.isPermitted()
    ],
    create: [
       auth.hooks.hashPassword()
    ]   
  }
});

app.listen(3030);
```

### Client

```js
const feathers = require('feathers');
const auth = require('feathers-authentication-client');
const hooks = require('feathers-hooks');
const rest = require('feathers-rest');

const client = feathers()
  .configure(hooks())
  .configure(auth())
  .configure(rest('http://localhost:3030/').jQuery());

client.service('authentication').hooks({
  after: {
    create: [
      // This hook could be more generic and a bundled hook
      function fetchCurrentUser(hook) {
        return client.authentication
          .verifyJWT(hook.result.accessToken)
          .then(payload => client.service('users').get(payload.userId))
          .then(user => {
            hook.result.user = user;
            return Promise.resolve(hook);
          });
      }
    ]
  }
});

client.service('authentication').create({
  email: 'admin@feathersjs.com',
  password: 'password'
})
.then(result => {
  client.set('accessToken', result.accessToken);
  client.set('refreshToken', result.refreshToken);
  client.set('user', result.user);

  // Do other authenticated things
});
```
