# Common Authentication Data Flows

## Authorization Creation (ie. Login)
1. Client authenticates without JWT. (ie. email/password, oauth, etc)
2. Invalidate any existing authorizations and refresh tokens for that user/client combo.
3. Create a new authorization record in the database with
  - id (unique)
  - entityId (unique)
  - clientId (unique)
  - permissions (maybe if they get default permissions)
   
  _A authorization can have any number of verifying ids/values (ie. we could also add an organizationId, MFA pin, etc. into the mix)_

4. Create an access token (JWT) with the verification values/ids:
  - authorizationId
  - entityId (verification values)
  - clientId
  
  **NOTE:** This could now actually have a long TTL
5. Create a refresh token with a very long TTL
  - refreshId
  - entityId (verification values)
  - clientId
6. Send back the access token (JWT) and refresh token (JWT) to the client

## Access Token Verification
The access token (JWT) is passed via an `Authorization` header **or** is attached to the connected socket. These are requests made to anything but the `/authentication` service.

1. Client sends valid JWT access token or it's attached to the connected socket
2. Server verifies JWT (in our special auth middleware) to ensure it is not:
  - expired (then it removes or flags authorization as revoked/expired)
  - malformed
  - tampered with
3. Server decodes the token payload and passes it down the auth middleware chain
4. Server looks up authorization record by the `authorizationId` and passes it down the auth middleware chain (populateAuthorization)
5. Your own custom auth middleware validates the authorization
  - if valid then proceed to the service before hooks or any other auth middleware.
  - if invalid set `data.authenticated = false` and move on to next middleware
6. Service `before` hook, `isAuthenticated` checks to see if the request is authenticated.
    - If it is proceed to next hook or service method
    - If it isn't it rejects with a `NotAuthenticated` error
7. Service `before` hook, `isPermitted` checks to see if the request is authenticated.
    - If it is proceed to next hook or service method
    - If it isn't it rejects with a `Forbidden` error
8. Service method is called and returns through after hooks
9. Response is sent back to the client

## Logout (Not Expired Token)

1. Client `DELETE` to `/authentication/:authorization_id` service with a valid JWT access token.
2. Server verifies the token
3. Looks up the authorization
4. Calls `remove` on the `authorization` service
5. Calls `app.emit('logout)`
6. Responds with success
7. Client can do whatever it wants (typically redirect to somewhere)

## Logout (Expired Token)

1. Client `DELETE` to `/authentication/:authorization_id` service with a expired JWT access token.
2. Server recognizes the token is expired (removes or flags authorization as revoked/expired)
3. Returns a `TokenExpired` error to the client
4. Client can do whatever it wants (typically redirect to somewhere)

## Authorization Renewal/Extension without Refresh Token
An expired access token (JWT) is passed via an `Authorization` header **or** is attached to the connected socket. These are requests made to anything but the `/authentication` service.

1. Client sends expired JWT access token or it's attached to the connected socket
2. Server verifies JWT and determines it is expired
  - returns a `NotAuthenticated` error with a "token expired" message to the client (current)
  - **Proposed Change:** Return a special error type of `TokenExpired` and flags authorization as expired/revoked or delete it altogether.
3. Client handles the error however they want (typically a redirect to login again)
  - The client could also send a refresh token, or ClientId and ClientSecret to automatically get a new JWT access token depending on what is applicable to your app.

## Authorization Renewal/Extension via Refresh Token
An expired access token (JWT) is passed via an `Authorization` header **or** is attached to the connected socket. These are requests made to anything but the `/authentication` service.

1. Client sends expired JWT access token or it's attached to the connected socket
2. Server verifies JWT and determines it is expired
  - returns a `NotAuthenticated` error with a "token expired" message to the client (current)
  - **Proposed Change:** Return a special error type of `TokenExpired` and flags authorization as expired/revoked
3. Client sends a valid refresh token to `/authentication` service
4. Server verifies the refresh token to ensure it has not
  - expired
  - malformed
  - has not been tampered with
5. Server decodes the payload
6. Server looks up refreshId on some service (TBD)
  - If valid goes through access token creation flow which deletes the `refreshId` from the database.
  - Else returns a `NotAuthenticated` error
