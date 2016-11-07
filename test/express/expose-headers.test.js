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
  let next;

  beforeEach(() => {
    req = {
      feathers: {},
      headers
    };
    res = {};
    next = sinon.spy();
  });

  afterEach(() => {
    next.reset();
  });

  it('adds the headers object to req.feathers', () => {
    exposeHeaders()(req, res, next);
    expect(req.feathers.headers).to.deep.equal(headers);
  });

  it('calls next', () => {
    exposeHeaders()(req, res, next);
    expect(next).to.have.been.calledOnce;
  });
});