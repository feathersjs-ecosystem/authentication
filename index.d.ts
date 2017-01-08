
export default function init (config?: Options): () => void;

interface Options {
    path: '/authentication';
    header: 'Authorization';
    entity: 'user';
    service: 'users';
    passReqToCallback: true;
    session: false;
    cookie: {
      enabled: false;
      name: 'feathers-jwt';
      httpOnly: false;
      secure: true;
    };
    jwt: {
      /**
       * By default is an access token but can be any type
       */
      header: { typ: 'access' };

      /**
       * The resource server where the token is processed
       */
      audience: 'https://yourdomain.com';

      /**
       * Typically the entity id associated with the JWT
       */
      subject: 'anonymous';

      /**
       * The issuing server, application or resource
       */
      issuer: 'feathers';
      algorithm: 'HS256';
      expiresIn: '1d'
    }
}
