import Debug from 'debug';

const debug = Debug('feathers-authentication:token:verifyKey');

export default function(options) {
  return function verifyKey(data) {
    if (data && data[options.keyfield]) {
      const app = this;
      const key = data[options.keyfield];

      debug('Verifying api key', key);

      const query = {
        [options.keyfield]: key,
        $limit: 1
      };

      return app.service(options.service).find({ query })
        .then(result => Object.assign({ authenticated: true }, data, result));
    }

    return Promise.resolve(data);
  };
}
