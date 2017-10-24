const { expect } = require('chai');
const { exposeCookies } = require('../../lib/express');

const cookies = {
  'feathers-jwt': 'cookie cookie cookie'
};

describe('express:exposeCookies', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      feathers: {},
      cookies
    };
    res = {};
  });

  it('adds the cookies object to req.feathers', done => {
    exposeCookies()(req, res, () => {
      expect(req.feathers.cookies).to.deep.equal(cookies);
      done();
    });
  });

  it('calls next', next => {
    exposeCookies()(req, res, next);
  });
});
