import errors from 'feathers-errors';
import _ from 'lodash';

const defaults = {
  idField: '_id',
  ownerField: 'userId'
};

function getRestrictions(restrictions, user, data) {
  const name = _.get(user, 'name') || _.get(user, 'email') || 'You';

  // Make restrictions an array if it's not
  restrictions = _.castArray(restrictions);

  var includeS = '';

  const restrictionsString = _
    .chain(restrictions)
    .map(restriction => _.has(data, restriction)? restriction: null)
    .compact()
    .value()
    .join(', ');

  if(!restrictionsString) { return null; }

  var restrictionsStringModified;

  if(restrictionsString.split(',').length > 0) {
    restrictionsStringModified = restrictionsString.replace(/,(?!.*,)/gmi, ' or');
    if(restrictionsString.split(',').length > 1) {
      includeS = 's';
    }
  }

  return `${name} ${name === 'You'? 'are' : 'is'} not permitted to update the ${restrictionsStringModified} field${includeS}.`;
}

export default function(options = {}){
  return function(hook) {
    if (hook.type !== 'before') {
      throw new Error(`The 'ownerOrRestrictChanges' hook should only be used as a 'before' hook.`);
    }

    if (hook.method !== 'update' && hook.method !== 'patch') {
      throw new errors.MethodNotAllowed(`The 'ownerOrRestrictChanges' hook should only be used on the 'update' or 'patch' service methods.`);
    }

    if(!hook.id) {
      throw new errors.MethodNotAllowed(`The hook.id for the item must be supplied.`);
    }

    // If it was an internal call then skip this hook
    if (!hook.params.provider) {
      return hook;
    }

    let restrictionMessage = '';

    if (!hook.params.user) {
      restrictionMessage = getRestrictions(options.restrictOn, _.get(hook, 'params.user'), hook.data);

      if(restrictionMessage) {
        throw new errors.Forbidden(restrictionMessage);
      } else {
        return hook;
      }
    }

    options = Object.assign({}, defaults, hook.app.get('auth'), options);

    const id = hook.params.user[options.idField];

    if (id === undefined) {
      throw new Error(`'${options.idField} is missing from current user.'`);
    }

    // look up the document and throw a Forbidden error if the user is not an owner and tries to change restricted fields
    return new Promise((resolve, reject) => {
      // Set provider as undefined so we avoid an infinite loop if this hook is
      // set on the resource we are requesting.
      const params = Object.assign({}, hook.params, { provider: undefined });

      return this.get(hook.id, params).then(data => {
        if (data.toJSON) {
          data = data.toJSON();
        }
        else if (data.toObject) {
          data = data.toObject();
        }

        let field = data[options.ownerField];

        // Handle nested Sequelize or Mongoose models
        if (_.isPlainObject(field)) {
          field = field[options.idField];
        }

        if (Array.isArray(field)) {
          const fieldArray = field.map(idValue => idValue.toString());
          if (fieldArray.length === 0 || fieldArray.indexOf(id.toString()) < 0) {

            restrictionMessage = getRestrictions(options.restrictOn, _.get(hook, 'params.user'), hook.data);

            if(restrictionMessage) {
              throw new errors.Forbidden(restrictionMessage);
            } else {
              return resolve(hook);
            }
          }
        } else if ( field === undefined || field.toString() !== id.toString() ) {

          restrictionMessage = getRestrictions(options.restrictOn, _.get(hook, 'params.user'), hook.data);

          if(restrictionMessage) {
            throw new errors.Forbidden(restrictionMessage);
          } else {
            return resolve(hook);
          }
        }

        resolve(hook);
      }).catch(reject);
    });
  };
}
