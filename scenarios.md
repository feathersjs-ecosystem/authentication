# Authentication Scenarios

## Definitions

- `Client` - A browser, mobile or IoT device, or other server that makes requests to the server.
- `Server` - Your server that authenticates entities, issues and verifies tokens.
- `ClientID` - A unique client identifier that is encoded in the payload of a JWT access token.
- `ClientSecret` - A private key shared between a client and server.
- `Entity` - A thing requesting API access (this could be a user, organization, device, etc.)
- `API Key` - A unique hash that is associated to an entity (this could really be an access token)
- `Access token (JWT)` - A JWT that sent by the client in:
    - the message body on a Socket `authenticate` event; or
    - every HTTP request as an `Authorization` header.

    It is verified on every incoming request or socket message to ensure:

    - the token hasn't expired
    - the entity it is associated with still exists
    - the token hasn't been revoked

- `Refresh Token` - A secret token (could be a JWT, could be just a hash) that can be used to request a new access token.
- `Permissions/Scopes` - Series of access permissions that are associated to an access token.
- `Cookie` - A browser header that contains a signed access token (JWT). Used for server side templated or universal apps (used similarly to a session).
- `Blacklist` - A list of access tokens that are not expired but flagged as invalid or revoked.
- `Whitelist` - A list of access tokens that are not expired and currently valid for your API.

## Caveats to JWT

JWT access tokens cannot be truly stateless unless you or okay with eventual consistency limited to the TTL of the tokens. Since JWTs are only invalidated if they are expired, tampered with, or malformed they cannot be explicitly revoked without checking a blacklist or whitelist (which requires storing state). So the JWTs themselves may be stateless but the complete validation of them is not.

Without a blacklist/whitelist they are not suitable for API keys, as is implied in [this article from Auth0](https://auth0.com/blog/using-json-web-tokens-as-api-keys/). A contrived example based off the Auth0 article:

Permissions are encoded in the token payload. If the permissions are revoked prior to the access token expiration the client could still send the access token with the old permissions until the token expires. This would not be possible if you blacklisted the access token when permissions were altered.

## Types of Auth Flows

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

1.

### Authenticating and Redirecting to another domain

Utilizes putting token in the querystring or a cookie scoped to the subdomain.

### API Key Authentication

