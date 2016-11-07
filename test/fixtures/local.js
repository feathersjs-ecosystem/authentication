// Local authentication using username/password
import auth from '../../lib/index';
import { Strategy as LocalStrategy } from 'passport-local';

export default function () {
  const app = this;

  const localHandler = function(req, username, password, done) {
    console.log('Local Auth Callback');
    console.log(req, username, password);

    const query = {
      email: username
    };

    app.service('users').find({ query }).then(result => {
      // Paginated services return the array of results in the data attribute.
      let user = result[0] || result.data && result.data[0];

      console.log(result, user);

      // Handle bad username.
      if (!user) {
        return done(null, false);
      }

      done(null, user);
    }).catch(error => done(error, false));
  };

  app.passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
    session: false
  }, localHandler));

  app.get('/login', function(req, res, next) {
    console.log('Login route');

    res.json({ login: true });
  });

  app.post('/login', auth.express.authenticate('local', { session: false, failureRedirect: '/login', successRedirect: '/' }), function(req, res, next) {
    console.log('Logged in', req.user);
    res.json(req.user);
  });
}