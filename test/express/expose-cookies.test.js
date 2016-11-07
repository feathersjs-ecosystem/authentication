import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { exposeCookies } from '../../src/express';

chai.use(sinonChai);

const cookies = {
  'feathers-jwt': 'cookie cookie cookie'
};

describe('express:exposeCookies', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      feathers: {},
      cookies
    };
    res = {};
    next = sinon.spy();
  });

  afterEach(() => {
    next.reset();
  });

  it('adds the cookies object to req.feathers', () => {
    exposeCookies()(req, res, next);
    expect(req.feathers.cookies).to.deep.equal(cookies);
  });

  it('calls next', () => {
    exposeCookies()(req, res, next);
    expect(next).to.have.been.calledOnce;
  });
});