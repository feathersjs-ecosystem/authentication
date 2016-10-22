// import { expect } from 'chai';
// import feathers from 'feathers';
// import hooks from 'feathers-hooks';
// import authentication from '../../src';
// import tokenAuth from '../../src/authentication/token-auth';

// describe('token-auth hook', () => {
//   const app = feathers().configure(hooks())
//     .configure(authentication({
//       secret: 'supersecret'
//     }));

//   it('throws an error without a service', () => {
//     try {
//       tokenAuth({
//         service: 'dummy'
//       }).call({
//         service() {
//           return null;
//         }
//       });
//       expect(false).to.be.ok;
//     } catch(e) {
//       expect(e.message).to.equal(`Authentication service 'dummy' does not exist`);
//     }
//   });

//   it('configures and uses token authentication', () => {
//     const payload = { testing: 'original' };

//     return app.authentication.createJWT(payload)
//       .then( ({ token }) =>
//         app.service('authentication').create({
//           jwt: token,
//           payload: {
//             added: true,
//             testing: 'new payload'
//           }
//         }, {
//           provider: 'test'
//         })
//       )
//       .then(result => app.authentication.verifyJWT(result))
//       .then(result => {
//         const { payload } = result;

//         expect(payload.added).to.be.ok;
//         // Payload did not get overriden
//         expect(payload.testing).to.equal('original');
//       });
//   });
// });
