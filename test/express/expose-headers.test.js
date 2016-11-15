import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { exposeHeaders } from '../../src/express';

chai.use(sinonChai);

const headers = {
  'authorization': 'JWT:my token'
};

describe('express:exposeHeaders', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      feathers: {},
      headers
    };
    res = {};
  });

  it('adds the headers object to req.feathers', done => {
    exposeHeaders()(req, res, () => {
      expect(req.feathers.headers).to.deep.equal(headers);
      done();
    });
  });

  it('calls next', next => {
    exposeHeaders()(req, res, next);
  });
});