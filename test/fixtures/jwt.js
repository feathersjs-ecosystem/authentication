// Passport JWT Handler
import auth from '../../lib/index';
import { Strategy as JWTStrategy } from 'passport-jwt';
import { ExtractJwt } from 'passport-jwt';

export default function () {
  const app = this;

  const jwtHandler = function(req, payload, done) {
    console.log('JWT Auth Callback');
    console.log(req, payload);

    // Return the payload. We could also look up the user
    // or do whatever we want to further verify the JWT.
    done(null, payload);
  };

  const options = Object.assign({
    secretOrKey: app.get('auth').secret,
    jwtFromRequest: ExtractJwt.fromAuthHeader(),
    passReqToCallback: true
  }, app.get('auth').jwt);

  app.passport.use(new JWTStrategy(options, jwtHandler));
}