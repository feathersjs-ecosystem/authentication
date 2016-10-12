/*jshint expr: true*/

import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { exposeRequestResponse } from '../../../../src/middleware';

chai.use(sinonChai);

describe('middleware:rest:exposeRequestResponse', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};
    res = {};
    next = sinon.spy();
  });

  afterEach(() => {
    next.reset();
  });

  it('adds the request object to req.feathers', () => {
    exposeRequestResponse()(req, res, next);
    expect(req.feathers.req).to.deep.equal(req);
  });

  it('adds the response object to req.feathers', () => {
    exposeRequestResponse()(req, res, next);
    expect(req.feathers.res).to.deep.equal(res);
  });

  it('calls next', () => {
    exposeRequestResponse()(req, res, next);
    expect(next).to.have.been.calledOnce;
  });
});