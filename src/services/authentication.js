export class Authentication {
  create(data, params) {
    if(params.provider && !params.authentication) {
      return Promise.reject(new Error(`External ${params.provider} requests need to run through an authentication provider`));
    }

    return this.authentication.createJWT(data.payload);
  }

  remove(id, params) {
    const token = id !== null ? id : params.token;

    return this.authentication.verifyJWT({ token });
  }

  setup(app) {
    this.authentication = app.authentication;
  }
}
