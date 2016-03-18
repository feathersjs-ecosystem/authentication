const defaults = { adminField: 'admin' };

export default function(options = {}){
  options = Object.assign({}, defaults, options);

  return function(hook){
    if (hook.params.user && !hook.params.user[options.adminField] && hook.params.provider) {
      delete hook.data[options.adminField];
    }
  };
}
