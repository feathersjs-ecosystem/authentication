import { expect } from 'chai';
import { getJWT } from '../../src/client/utils';

describe('getJWT', () => {
  it(`get unexpired token from storage`, () => {
    let token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJleHAiOjE0NzYzOTI0ODAsImlhdCI6MjQ3NjM5MjQ4MCwiaXNzIjoiZmVhdGhlcnMifQ.YPR3RjzIZT-LZ2jhySRO2hiyIJAArJFqkWoMfnqCwTc`;
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
