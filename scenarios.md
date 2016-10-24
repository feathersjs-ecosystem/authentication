# Authentication Scenarios

## Definitions

- `Client` - A browser, mobile device, IoT device, or other server that makes requests to the your authentication server.
- `Server` - Your server that authenticates entities, issues and verifies tokens.
- `ClientID` - A unique client identifier that is encoded in the payload of a JWT access token.
- `ClientSecret` - A private key shared between a client and server. **Can't be used on an insecure client. Keep this private!**
- `Entity` - A thing requesting API access (this could be a user, organization, device, etc.)
- `Authentication Provider` - A 3rd party authentication provider (ie. Facebook, Twitter, etc.). They could expect users to authenticate via OAuth1/1a/2, SAML, API Key, Username + Password, LDAP, etc.

### Authorization Types
- `Access token (JWT)` - A JWT that sent by the client in:
    - the message body on a Socket `authenticate` event; or
    - every HTTP request as an `Authorization` header.

    It is verified on every incoming request or socket message to ensure:

    - the token hasn't expired
    - the entity it is associated with still exists
    - the token hasn't been revoked

- `Refresh Token` - A secret token (could be a JWT, could be just a hash) that can be used to request a new access token.
- `Permissions/Scopes` - Series of access permissions that are associated to an access token.
- `Cookie` - A browser header that contains a signed access token (JWT). Used for server side templated, universal apps, or headless browser clients (used similarly to a session). The only difference between this and an Authorization header is the server sets it after successful authentication. It is mainly meant for when you do not have JavaScript enabled on the client.

#### These might not make sense

- `Blacklist` - A list of access tokens that are not expired but flagged as invalid or revoked.
- `Whitelist` - A list of access tokens that are not expired and currently valid for your API.

We might just need to keep a collection or table of Authorizations and you can simply check for presence of an Authorization ID or add a flag to that collection or table as to whether it is valid or not.

## Caveats to JWT

JWT access tokens cannot be truly stateless unless you or okay with eventual consistency limited to the TTL of the tokens. Since JWTs are only invalidated if they are expired, tampered with, or malformed they cannot be explicitly revoked without checking a blacklist or whitelist (which requires storing state). So the JWTs themselves may be stateless but the complete validation of them is not.

Without a blacklist/whitelist they are not suitable for API keys, as is implied in [this article from Auth0](https://auth0.com/blog/using-json-web-tokens-as-api-keys/). A contrived example based off the Auth0 article:

Permissions are encoded in the token payload. If the permissions are revoked prior to the access token expiration the client could still send the access token with the old permissions until the token expires. This would not be possible if you blacklisted the access token when permissions were altered.

## Proposal
A User can have multiple clients. Each of which can be granted an authorization, which can contain many types of tokens. I think we should norm on an access token (JWT) and a refresh token (possibly also JWT) to start. The access token would have the Entity ID, Authorization ID, and the Client ID in the payload. These are all stored in a datastore or cache. This allows us to revoke tokens for an entire Entity, a Client or just individual tokens.

### Data Model
User -> has many -> Clients -> has many -> Authorizations ->  has many -> Permissions and Tokens

```js
// authorization
{
    _id: "762346asdg61dd",
    clientId: "234jhfh7sf62332",
    accessToken: "at_ghf89f892342grhja;kafs902632rdfao;ffjhafhsf9r2aad",
    refreshToken: "rt_ajh;asuh234ief58haioa;adhafuygg321dfssds",
    permissions: ["*"]
}
```

### Example 1: IoT Device Authentication

1. Register device with server. Send device serial or MAC address. Get back ClientID & ClientSecret. ClientID could be serial or MAC address.
2. Client stores both securely. Especially the ClientSecret.
3. Client authenticates with server by sending ClientID and ClientSecret.
4. Server verifies these and generates an Authorization for the Client, any default tokens (ie. a JWT access token and refresh token), and any default permissions. It encodes the ClientID and AuthorizationID in the JWT payload.
5. Sends the token back to the server.
6. Client stores refresh token securely
7. Client sends access token in `Authorization` header

### Example 2: Username + Password Authentication

1. Client authenticates with server by sending ClientID (username) & ClientSecret (password) to server.
2. Server verifies these and generates an Authorization for the Client, any default tokens (ie. a JWT access token and refresh token), and any default permissions. It encodes the ClientID and AuthorizationID in the JWT payload.
3. Sends the token back to the server.
4. Client stores refresh token securely
5. Client sends access token in `Authorization` header

Depending on your transport these auth flows are modified as in the examples below. I think keeping an `Authorizations` table or collection resolves the blacklist/whitelist scenario.

---

## Current Types of Auth Flows

### Authenticating Username and Password over Ajax

This is the most basic.

1. Client `POST`s username + password to `/authentication` over Ajax in the request body.
2. Server looks up entity by username
3. Server verifies password is correct using bcrypt hashing algorithm
4. Server creates a JWT access token with the entity's database ID encoded in the JWT payload
5. Server sends the signed JWT access token back to the client

### Authenticating Username and Password over Sockets

1. Client establishes socket connection
2. Client sends an `authenticate` message with the username + password in the message body
3. Server looks up entity by username
4. Server verifies password is correct using bcrypt hashing algorithm
5. Server creates a JWT access token with the entity's database ID encoded in the JWT payload
6. Server attaches the token to the socket
7. Server attaches the entity to the socket and registers event listeners to keep the entity up to date.
8. Server emits a `login` event with the token (can only be listened for server side)
9. Server sends the signed JWT access token back to the client

### Authenticating with Access Token over Ajax

1. Client `POST`s JWT access token to `/authentication` over Ajax in request body.
2. Server verifies token isn't expired, hasn't been tampered with and is a valid JWT format
3. Server decodes the token and passes the payload down the authentication chain
4. Server verifies the token is not in the blacklist or is in the whitelist, depending on how you want to set up things (this is not implemented so far).
5. Server looks up entity in the database by entity ID from the payload
6. Server emits a `login` event with the token (can only be listened for server side)
7. Server returns the same access token to the client. **This is not currently what happens and is what should happen.** Instead, the server creates a new JWT access token with the entity's database ID encoded in the JWT payload and  sends the new signed JWT access token back to the client. **This is a security risk because an attacker could, with one compromised valid JWT, generate an infinite number of valid JWTs!**

### Authenticating with Access Token over Sockets

1. Client establishes socket connection
2. Client sends an `authenticate` message with the access token in the message body
3. Server verifies token isn't expired, hasn't been tampered with and is a valid JWT format
4. Server decodes the token and passes the payload down the authentication chain
5. Server verifies the token is not in the blacklist or is in the whitelist, depending on how you want to set up things (this is not implemented so far).
6. Server looks up entity in the database by entity ID from the payload
Server attaches the token to the socket
7. Server attaches the entity to the socket and registers event listeners to keep the entity up to date.
8. Server emits a `login` event with the token (can only be listened for server side)
9. Server returns the same access token to the client. **This is not currently what happens and is what should happen.** Instead, the server creates a new JWT access token with the entity's database ID encoded in the JWT payload and  sends the new signed JWT access token back to the client. **This is a security risk because an attacker could, with one compromised valid JWT, generate an infinite number of valid JWTs!**

### Authenticating with Refresh Token over Ajax

TODO

### Authenticating with Refresh Token over Sockets

TODO

### Authorizing Access Token over HTTP Authorization Header

1. Client sends JWT access token to any endpoint in an `Authorization` header.
2. Server parses the token from the header if it exists and attaches it to the request object.
3. Server verifies token isn't expired, hasn't been tampered with and is a valid JWT format
4. Server decodes the token and passes the payload down the authentication chain
5. Server verifies the token is not in the blacklist or is in the whitelist, depending on how you want to set up things (this is not implemented so far).
6. Server looks up entity in the database by entity ID from the payload
7. Server checks entity permissions
8. Server processes the request

### Authorizing Access Token over Sockets

1. Client has already authenticated so the access token is attached to the socket object on server side.
2. Client sends any message to the server
3. Server verifies token isn't expired, hasn't been tampered with and is a valid JWT format
4. Server decodes the token and passes the payload down the authentication chain
5. Server verifies the token is not in the blacklist or is in the whitelist, depending on how you want to set up things (this is not implemented so far).
6. Server looks up entity in the database by entity ID from the payload
7. Server checks entity permissions
8. Server processes the request

### Old School Server Side Template

This utilizes an `httpOnly` cookie with the same expiration as the access token.

### Server Side Rendering/Universal app flow

This utilizes a cookie.

TODO

### Authenticating and Redirecting to another domain

Utilizes putting token in the querystring or a cookie scoped to the subdomain.

### API Key Authentication

TODO: Might not be needed or would simply be a ClientID

### Regular OAuth

TODO

### Access Token Based OAuth

In most cases this is for IoT devices or mobile devices. The user has already granted your application access to their profile through another mechanism that the regular OAuth HTTP redirects (ie. via a mobile app or CLI). The client sends their profile, OAuth `access_token` and possibly `refresh_token` to your server. The server verifies these with the OAuth authentication provider (ie. Facebook).

