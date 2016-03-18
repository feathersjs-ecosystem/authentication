/**
 * Add the authenticated user's id to the incoming data.
 * @param {String} userId - The key name on the params.user * where the
 * user's id will be found. Default is '_id'.
 * @param (String} as - The key name on the hook.data where the user's id
 * will be set. The default is `userId`.
 *
 * before
 * all, find, get, create, update, patch, remove
 */

const defaults = { userId: '_id', as: 'userId' };

export default function(options = {}){
  options = Object.assign({}, defaults, options);

  return function(hook) {
    function setId(obj){
      obj[options.destProp] = hook.params.user[options.sourceProp];
    }

    if (hook.params.user) {
      // Handle arrays.
      if (Array.isArray(hook.data)) {
        hook.data.forEach(item => {
          setId(item);
        });
      
      }
      // Handle single objects.
      else {
        setId(hook.data);
      }
    }
  };
}
