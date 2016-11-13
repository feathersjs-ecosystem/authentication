# Authentication Examples

>TODO (EK): This is kind of a dumping ground right now and needs to be cleaned up. Likely, each example will be moved to their own file.

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

### Customizing JWT Payload

```js
// Server Side
app.service('authentication').hooks({
  before: {
    create: [
      hasAcceptedTerms(),
      localAuth({
        clientIdField: 'email',
        clientSecretField: 'password',
        entity: 'user',
        service: 'users'
      }),
      populate({
        idField: '_id', // optional but should come from service.id
        service: 'users',
        entity: 'user',
        on: 'params'
      }),
      setJWTPayload()
    ]
  }
});
```

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

### Custom Passport Authentication

TODO

### Access Token Based OAuth

In most cases this is for IoT devices or mobile devices. The user has already granted your application access to their profile through another mechanism that the regular OAuth HTTP redirects (ie. via a mobile app or CLI). The client sends their profile, OAuth `access_token` and possibly `refresh_token` to your server. The server verifies these with the OAuth authentication provider (ie. Facebook).