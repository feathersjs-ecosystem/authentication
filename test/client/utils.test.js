import { expect } from 'chai';
import { getJWT, verifyJWT } from '../../src/client/utils';

describe('getJWT', () => {
  it(`get unexpired token from storage`, () => {
    let token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJleHAiOjI0NzYzOTI0ODAsImlhdCI6MTQ3NjM5MjQ4MCwiaXNzIjoiZmVhdGhlcnMifQ.yU1Jtiw-3ny7auXArUZm10ZP1zQGrzaliM3ky2W6F7c`;
    let storage = {
      getItem(){
        return Promise.resolve(token);
      }
    };
    getJWT('feathers-jwt', 'feathers-jwt', storage).then(jwt => {
      expect(jwt).to.equal(token);
    });
  });

  it(`expired jwt returns undefined`, () => {
    let storage = {
      getItem(){
        return Promise.resolve('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJleHAiOjE0NzYzOTI0ODAsImlhdCI6MTQ3NjM5MjQ4MCwiaXNzIjoiZmVhdGhlcnMifQ.6rzpXFqWSmNEotnWo8f-SQ2Ey4rbar3f0pQKNTHdq9A');
      }
    };
    getJWT('feathers-jwt', 'feathers-jwt', storage).then(jwt => {
      expect(jwt).to.equal(undefined);
    });
  });
});


describe('verifyJWT', () => {
  it('decodes a token string properly', () => {
    let token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZXhwIjozNDc2MzkyNDgwLCJpYXQiOjE0NzYzOTI0ODAsImlzcyI6ImZlYXRoZXJzIn0.0V6NKoNszBPeIA72xWs2FDW6aPxOnHzEmskulq20uyo`;
    let payload = verifyJWT(token);
    expect(payload).to.deep.equal({
      id: 1,
      exp: 3476392480,
      iat: 1476392480,
      iss: 'feathers'
    });
  });

  it('decodes a token from an object properly', () => {
    let data = {
      token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZXhwIjozNDc2MzkyNDgwLCJpYXQiOjE0NzYzOTI0ODAsImlzcyI6ImZlYXRoZXJzIn0.0V6NKoNszBPeIA72xWs2FDW6aPxOnHzEmskulq20uyo` 
    };
    let payload = verifyJWT(data);
    expect(payload).to.deep.equal({
      id: 1,
      exp: 3476392480,
      iat: 1476392480,
      iss: 'feathers'
    });
  });

  it('gracefully handles an invalid token', () => {
    let token = `lily`;
    let payload = verifyJWT(token);
    expect(payload).to.equal(undefined);
  });

  it('decodes an expired token as undefined', () => {
    let token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJleHAiOjE0NzYzOTI0ODAsImlhdCI6MTQ3NjM5MjQ4MCwiaXNzIjoiZmVhdGhlcnMifQ.6rzpXFqWSmNEotnWo8f-SQ2Ey4rbar3f0pQKNTHdq9A`;
    let payload = verifyJWT(token);
    expect(payload).to.equal(undefined);
  });
});
