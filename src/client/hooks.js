import utils from './utils';

export let populateParams = function(options = {}) {
  return function(hook) {
    hook.params.user = utils.getUser();
    hook.params.token = utils.getToken();
  };
};

export let populateHeader = function(options = {header: 'Authorization'}) {
  return function(hook) {
    hook.params.headers = {
      [options.header]: hook.params.token
    }
  }
};

export let populateSocketParams = function(options = {}) {
  return function(hook) {
    if (hook.params.token) {
      hook.params.query = {
        token: hook.params.token
      }  
    }
  };
};

export default {
  populateParams,
  populateHeader,
  populateSocketParams
}