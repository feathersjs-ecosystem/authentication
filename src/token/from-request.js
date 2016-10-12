import Debug from 'debug';

const debug = Debug('feathers-authentication:token:from-request');

export default function(options) {
  const header = options.header;

  if (!header) {
    throw new Error(`'header' property must be set in authentication options`);
  }

  return function fromRequest(data) {
    if (typeof data === 'object' && data.headers) {
      const req = data;

      debug('Parsing token from request');

      // Normalize header capitalization the same way Node.js does
      let token = req.headers && req.headers[header.toLowerCase()];

      // Check the header for the token (preferred method)
      if (token) {
        // if the value contains "bearer" or "Bearer" then cut that part out
        if (/bearer/i.test(token)) {
          token = token.split(' ')[1];
        }

        debug('Token found in header');
      }

      return Promise.resolve({ token, req });
    }

    return Promise.resolve(data);
  };
}
