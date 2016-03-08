(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.feathers = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = require('./lib/client');

},{"./lib/client":3}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;_e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }return _arr;
  }return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

exports.populateParams = populateParams;
exports.populateHeader = populateHeader;

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }return obj;
}

function populateParams(options) {
  return function (hook) {
    var storage = hook.app.service(options.storage);

    // We can not run this hook on the storage service itself
    if (this !== storage) {
      return Promise.all([storage.get('user'), storage.get('token')]).then(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2);

        var user = _ref2[0];
        var token = _ref2[1];

        Object.assign(hook.params, { user: user, token: token });
        return hook;
      });
    }
  };
}

function populateHeader() {
  var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  return function (hook) {
    if (hook.params.token) {
      hook.params.headers = Object.assign({}, _defineProperty({}, options.header || 'Authorization', hook.params.token), hook.params.headers);
    }
  };
}

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  var authOptions = Object.assign({}, defaults, opts);

  return function () {
    var app = this;
    var storage = function storage() {
      return app.service(authOptions.storage);
    };

    if (!storage) {
      throw new Error('You need register a local store before you can use feathers-authentication. Did you call app.use(\'storage\', localstorage())');
    }

    var handleResponse = function handleResponse(response) {
      return storage().create([{
        id: 'token',
        value: response.token
      }, {
        id: 'user',
        value: response.data
      }]).then(function () {
        return response;
      });
    };

    app.authenticate = function (options) {
      if (!options.type) {
        throw new Error('You need to provide a `type` attribute when calling app.authenticate()');
      }

      var endPoint = void 0;

      if (options.type === 'local') {
        endPoint = authOptions.localEndpoint;
      } else if (options.type === 'passwordless') {
        endPoint = authOptions.passwordlessEndpoint;
      } else if (options.type === 'token') {
        endPoint = authOptions.tokenEndpoint;
      } else {
        throw new Error('Unsupported authentication \'type\': ' + options.type);
      }

      return new Promise(function (resolve, reject) {
        // TODO (EK): Handle OAuth logins
        // If we are using a REST client
        if (app.rest) {
          return app.service(endPoint).create(options).then(handleResponse);
        }

        if (app.io || app.primus) {
          (function () {
            var socket = app.io || app.primus;
            var handleUnauthorized = function handleUnauthorized(error) {
              // Unleak event handlers
              this.off('disconnect', reject);
              this.off('close', reject);

              reject(error);
            };
            var handleAuthenticated = function handleAuthenticated(response) {
              // We need to bind and unbind the event handlers that didn't run
              // so that they don't leak around
              this.off('unauthorized', handleUnauthorized);
              this.off('disconnect', reject);
              this.off('close', reject);

              handleResponse(response).then(function (reponse) {
                return resolve(reponse);
              }).catch(function (error) {
                throw error;
              });
            };

            // Also, binding to events that aren't fired (like `close`)
            // for Socket.io doesn't hurt if we unbind once we're done
            socket.once('disconnect', reject);
            socket.once('close', reject);
            socket.once('unauthorized', handleUnauthorized);
            socket.once('authenticated', handleAuthenticated);
          })();
        }

        // If we are using socket.io
        if (app.io) {
          var socket = app.io;

          // If we aren't already connected then throw an error
          if (!socket.connected) {
            throw new Error('Socket not connected');
          }

          socket.emit('authenticate', options);
        }

        // If we are using primus
        if (app.primus) {
          var _socket = app.primus;

          // If we aren't already connected then throw an error
          if (_socket.readyState !== 3) {
            throw new Error('Socket not connected');
          }

          _socket.send('authenticate', options);
        }
      });
    };

    app.user = function () {
      return storage().get('user').then(function (data) {
        return data.value;
      });
    };

    app.token = function () {
      return storage().get('token').then(function (data) {
        return data.value;
      });
    };

    app.logout = function () {
      return storage().remove(null, { id: { $in: ['user', 'token'] } });
    };

    // Set up hook that adds adds token and user to params so that
    // it they can be accessed by client side hooks and services
    app.mixins.push(function (service) {
      if (!service.before || !service.after) {
        throw new Error('It looks like feathers-hooks isn\'t configured. It is required before you configure feathers-authentication.');
      }
      service.before(hooks.populateParams(authOptions));
    });

    // Set up hook that adds authorization header for REST provider
    if (app.rest) {
      app.mixins.push(function (service) {
        if (!service.before || !service.after) {
          throw new Error('It looks like feathers-hooks isn\'t configured. It is required before you configure feathers-authentication.');
        }
        service.before(hooks.populateHeader(authOptions));
      });
    }
  };
};

var _hooks = require('./hooks');

var hooks = _interopRequireWildcard(_hooks);

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
      }
    }newObj.default = obj;return newObj;
  }
}

var defaults = {
  storage: '/storage',
  localEndpoint: '/auth/local',
  passwordlessEndpoint: '/auth/passwordless',
  tokenEndpoint: '/auth/token'
};

module.exports = exports['default'];

},{"./hooks":2}],4:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],5:[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage(){
  try {
    return window.localStorage;
  } catch (e) {}
}

},{"./debug":6}],6:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":43}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getArguments;

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

var noop = exports.noop = function noop() {};
var getCallback = function getCallback(args) {
  var last = args[args.length - 1];
  return typeof last === 'function' ? last : noop;
};
var getParams = function getParams(args, position) {
  return _typeof(args[position]) === 'object' ? args[position] : {};
};

var updateOrPatch = function updateOrPatch(name) {
  return function (args) {
    var id = args[0];
    var data = args[1];
    var callback = getCallback(args);
    var params = getParams(args, 2);

    if (typeof id === 'function') {
      throw new Error('First parameter for \'' + name + '\' can not be a function');
    }

    if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) !== 'object') {
      throw new Error('No data provided for \'' + name + '\'');
    }

    if (args.length > 4) {
      throw new Error('Too many arguments for \'' + name + '\' service method');
    }

    return [id, data, params, callback];
  };
};

var getOrRemove = function getOrRemove(name) {
  return function (args) {
    var id = args[0];
    var params = getParams(args, 1);
    var callback = getCallback(args);

    if (args.length > 3) {
      throw new Error('Too many arguments for \'' + name + '\' service method');
    }

    if (typeof id === 'function') {
      throw new Error('First parameter for \'' + name + '\' can not be a function');
    }

    return [id, params, callback];
  };
};

var converters = exports.converters = {
  find: function find(args) {
    var callback = getCallback(args);
    var params = getParams(args, 0);

    if (args.length > 2) {
      throw new Error('Too many arguments for \'find\' service method');
    }

    return [params, callback];
  },
  create: function create(args) {
    var data = args[0];
    var params = getParams(args, 1);
    var callback = getCallback(args);

    if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) !== 'object') {
      throw new Error('First parameter for \'create\' must be an object');
    }

    if (args.length > 3) {
      throw new Error('Too many arguments for \'create\' service method');
    }

    return [data, params, callback];
  },

  update: updateOrPatch('update'),

  patch: updateOrPatch('patch'),

  get: getOrRemove('get'),

  remove: getOrRemove('remove')
};

function getArguments(method, args) {
  return converters[method](args);
}
},{}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _arguments = require('./arguments');

var _arguments2 = _interopRequireDefault(_arguments);

var _utils = require('./utils');

var _hooks = require('./hooks');

var _hooks2 = _interopRequireDefault(_hooks);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  getArguments: _arguments2.default,
  stripSlashes: _utils.stripSlashes,
  each: _utils.each,
  hooks: _hooks2.default
};
module.exports = exports['default'];
},{"./arguments":7,"./hooks":9,"./utils":10}],9:[function(require,module,exports){
'use strict';

var _utils = require('./utils');

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function getOrRemove(args) {
  return {
    id: args[0],
    params: args[1],
    callback: args[2]
  };
}

function updateOrPatch(args) {
  return {
    id: args[0],
    data: args[1],
    params: args[2],
    callback: args[3]
  };
}

exports.converters = {
  find: function find(args) {
    return {
      params: args[0],
      callback: args[1]
    };
  },
  create: function create(args) {
    return {
      data: args[0],
      params: args[1],
      callback: args[2]
    };
  },
  get: getOrRemove,
  remove: getOrRemove,
  update: updateOrPatch,
  patch: updateOrPatch
};

exports.hookObject = function (method, type, args) {
  var hook = exports.converters[method](args);

  hook.method = method;
  hook.type = type;

  return hook;
};

exports.makeArguments = function (hookObject) {
  var result = [];
  if (typeof hookObject.id !== 'undefined') {
    result.push(hookObject.id);
  }

  if (hookObject.data) {
    result.push(hookObject.data);
  }

  result.push(hookObject.params || {});
  result.push(hookObject.callback);

  return result;
};

exports.convertHookData = function (obj) {
  var hookObject = {};

  if (Array.isArray(obj)) {
    hookObject = { all: obj };
  } else if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) !== 'object') {
    hookObject = { all: [obj] };
  } else {
    (0, _utils.each)(obj, function (value, key) {
      hookObject[key] = !Array.isArray(value) ? [value] : value;
    });
  }

  return hookObject;
};
},{"./utils":10}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stripSlashes = stripSlashes;
exports.each = each;

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function stripSlashes(name) {
  return name.replace(/^(\/*)|(\/*)$/g, '');
}

function each(obj, callback) {
  if (obj && typeof obj.forEach === 'function') {
    obj.forEach(callback);
  } else if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object') {
    Object.keys(obj).forEach(function (key) {
      return callback(obj[key], key);
    });
  }
}
},{}],11:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _extendableBuiltin(cls) {
  function ExtendableBuiltin() {
    var instance = Reflect.construct(cls, Array.from(arguments));
    Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
    return instance;
  }

  ExtendableBuiltin.prototype = Object.create(cls.prototype, {
    constructor: {
      value: cls,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });

  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(ExtendableBuiltin, cls);
  } else {
    ExtendableBuiltin.__proto__ = cls;
  }

  return ExtendableBuiltin;
}

var debug = require('debug')('feathers-errors');

// NOTE (EK): Babel doesn't properly support extending
// some classes in ES6. The Error class being one of them.
// Node v5.0+ does support this but until we want to drop support
// for older versions we need this hack.
// http://stackoverflow.com/questions/33870684/why-doesnt-instanceof-work-on-instances-of-error-subclasses-under-babel-node
// https://github.com/loganfsmyth/babel-plugin-transform-builtin-extend

var FeathersError = (function (_extendableBuiltin2) {
  _inherits(FeathersError, _extendableBuiltin2);

  function FeathersError(msg, name, code, className, data) {
    _classCallCheck(this, FeathersError);

    msg = msg || 'Error';

    var errors = undefined;
    var message = undefined;
    var newData = undefined;

    if (msg instanceof Error) {
      message = msg.message || 'Error';

      // NOTE (EK): This is typically to handle validation errors
      if (msg.errors) {
        errors = msg.errors;
      }
    }
    // Support plain old objects
    else if ((typeof msg === 'undefined' ? 'undefined' : _typeof(msg)) === 'object') {
        message = msg.message || 'Error';
        data = msg;
      }
      // message is just a string
      else {
          message = msg;
        }

    if (data) {
      // NOTE(EK): To make sure that we are not messing
      // with immutable data, just make a copy.
      // https://github.com/feathersjs/feathers-errors/issues/19
      newData = _extends({}, data);

      if (newData.errors) {
        errors = newData.errors;
        delete newData.errors;
      }
    }

    // NOTE (EK): Babel doesn't support this so
    // we have to pass in the class name manually.
    // this.name = this.constructor.name;

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(FeathersError).call(this, message));

    _this.type = 'FeathersError';
    _this.name = name;
    _this.message = message;
    _this.code = code;
    _this.className = className;
    _this.data = newData;
    _this.errors = errors || {};

    debug(_this.name + '(' + _this.code + '): ' + _this.message);
    return _this;
  }

  // NOTE (EK): A little hack to get around `message` not
  // being included in the default toJSON call.

  _createClass(FeathersError, [{
    key: 'toJSON',
    value: function toJSON() {
      return {
        name: this.name,
        message: this.message,
        code: this.code,
        className: this.className,
        data: this.data,
        errors: this.errors
      };
    }
  }]);

  return FeathersError;
})(_extendableBuiltin(Error));

var BadRequest = (function (_FeathersError) {
  _inherits(BadRequest, _FeathersError);

  function BadRequest(message, data) {
    _classCallCheck(this, BadRequest);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(BadRequest).call(this, message, 'BadRequest', 400, 'bad-request', data));
  }

  return BadRequest;
})(FeathersError);

var NotAuthenticated = (function (_FeathersError2) {
  _inherits(NotAuthenticated, _FeathersError2);

  function NotAuthenticated(message, data) {
    _classCallCheck(this, NotAuthenticated);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(NotAuthenticated).call(this, message, 'NotAuthenticated', 401, 'not-authenticated', data));
  }

  return NotAuthenticated;
})(FeathersError);

var PaymentError = (function (_FeathersError3) {
  _inherits(PaymentError, _FeathersError3);

  function PaymentError(message, data) {
    _classCallCheck(this, PaymentError);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(PaymentError).call(this, message, 'PaymentError', 402, 'payment-error', data));
  }

  return PaymentError;
})(FeathersError);

var Forbidden = (function (_FeathersError4) {
  _inherits(Forbidden, _FeathersError4);

  function Forbidden(message, data) {
    _classCallCheck(this, Forbidden);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Forbidden).call(this, message, 'Forbidden', 403, 'forbidden', data));
  }

  return Forbidden;
})(FeathersError);

var NotFound = (function (_FeathersError5) {
  _inherits(NotFound, _FeathersError5);

  function NotFound(message, data) {
    _classCallCheck(this, NotFound);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(NotFound).call(this, message, 'NotFound', 404, 'not-found', data));
  }

  return NotFound;
})(FeathersError);

var MethodNotAllowed = (function (_FeathersError6) {
  _inherits(MethodNotAllowed, _FeathersError6);

  function MethodNotAllowed(message, data) {
    _classCallCheck(this, MethodNotAllowed);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(MethodNotAllowed).call(this, message, 'MethodNotAllowed', 405, 'method-not-allowed', data));
  }

  return MethodNotAllowed;
})(FeathersError);

var NotAcceptable = (function (_FeathersError7) {
  _inherits(NotAcceptable, _FeathersError7);

  function NotAcceptable(message, data) {
    _classCallCheck(this, NotAcceptable);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(NotAcceptable).call(this, message, 'NotAcceptable', 406, 'not-acceptable', data));
  }

  return NotAcceptable;
})(FeathersError);

var Timeout = (function (_FeathersError8) {
  _inherits(Timeout, _FeathersError8);

  function Timeout(message, data) {
    _classCallCheck(this, Timeout);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Timeout).call(this, message, 'Timeout', 408, 'timeout', data));
  }

  return Timeout;
})(FeathersError);

var Conflict = (function (_FeathersError9) {
  _inherits(Conflict, _FeathersError9);

  function Conflict(message, data) {
    _classCallCheck(this, Conflict);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Conflict).call(this, message, 'Conflict', 409, 'conflict', data));
  }

  return Conflict;
})(FeathersError);

var Unprocessable = (function (_FeathersError10) {
  _inherits(Unprocessable, _FeathersError10);

  function Unprocessable(message, data) {
    _classCallCheck(this, Unprocessable);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Unprocessable).call(this, message, 'Unprocessable', 422, 'unprocessable', data));
  }

  return Unprocessable;
})(FeathersError);

var GeneralError = (function (_FeathersError11) {
  _inherits(GeneralError, _FeathersError11);

  function GeneralError(message, data) {
    _classCallCheck(this, GeneralError);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(GeneralError).call(this, message, 'GeneralError', 500, 'general-error', data));
  }

  return GeneralError;
})(FeathersError);

var NotImplemented = (function (_FeathersError12) {
  _inherits(NotImplemented, _FeathersError12);

  function NotImplemented(message, data) {
    _classCallCheck(this, NotImplemented);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(NotImplemented).call(this, message, 'NotImplemented', 501, 'not-implemented', data));
  }

  return NotImplemented;
})(FeathersError);

var Unavailable = (function (_FeathersError13) {
  _inherits(Unavailable, _FeathersError13);

  function Unavailable(message, data) {
    _classCallCheck(this, Unavailable);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Unavailable).call(this, message, 'Unavailable', 503, 'unavailable', data));
  }

  return Unavailable;
})(FeathersError);

var errors = {
  FeathersError: FeathersError,
  BadRequest: BadRequest,
  NotAuthenticated: NotAuthenticated,
  PaymentError: PaymentError,
  Forbidden: Forbidden,
  NotFound: NotFound,
  MethodNotAllowed: MethodNotAllowed,
  NotAcceptable: NotAcceptable,
  Timeout: Timeout,
  Conflict: Conflict,
  Unprocessable: Unprocessable,
  GeneralError: GeneralError,
  NotImplemented: NotImplemented,
  Unavailable: Unavailable
};

exports.default = _extends({ types: errors, errors: errors }, errors);
module.exports = exports['default'];
},{"debug":5}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.lowerCase = lowerCase;
exports.remove = remove;
exports.disable = disable;
var errors = require('feathers-errors').errors;

function lowerCase() {
  for (var _len = arguments.length, fields = Array(_len), _key = 0; _key < _len; _key++) {
    fields[_key] = arguments[_key];
  }

  var lowerCaseFields = function lowerCaseFields(data) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = fields[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var field = _step.value;

        data[field] = data[field].toLowerCase();
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  };

  var callback = typeof fields[fields.length - 1] === 'function' ? fields.pop() : function () {
    return true;
  };

  return function (hook) {
    var result = hook.type === 'before' ? hook.data : hook.result;
    var next = function next(condition) {
      if (result && condition) {
        if (hook.method === 'find' || Array.isArray(result)) {
          // data.data if the find method is paginated
          (result.data || result).forEach(lowerCaseFields);
        } else {
          lowerCaseFields(result);
        }
      }
      return hook;
    };

    var check = callback(hook);

    return check && typeof check.then === 'function' ? check.then(next) : next(check);
  };
}

function remove() {
  for (var _len2 = arguments.length, fields = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    fields[_key2] = arguments[_key2];
  }

  var removeFields = function removeFields(data) {
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = fields[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var field = _step2.value;

        data[field] = undefined;
        delete data[field];
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }
  };
  var callback = typeof fields[fields.length - 1] === 'function' ? fields.pop() : function (hook) {
    return !!hook.params.provider;
  };

  return function (hook) {
    var result = hook.type === 'before' ? hook.data : hook.result;
    var next = function next(condition) {
      if (result && condition) {
        if (hook.method === 'find' || Array.isArray(result)) {
          // data.data if the find method is paginated
          (result.data || result).forEach(removeFields);
        } else {
          removeFields(result);
        }
      }
      return hook;
    };

    var check = callback(hook);

    return check && typeof check.then === 'function' ? check.then(next) : next(check);
  };
}

function disable(realm) {
  var _arguments = arguments;

  if (!realm) {
    return function (hook) {
      throw new errors.MethodNotAllowed('Calling \'' + hook.method + '\' not allowed.');
    };
  } else if (typeof realm === 'function') {
    return function (hook) {
      var result = realm(hook);
      var next = function next(check) {
        if (!check) {
          throw new errors.MethodNotAllowed('Calling \'' + hook.method + '\' not allowed.');
        }
      };

      if (result && typeof result.then === 'function') {
        return result.then(next);
      }

      next(result);
    };
  } else {
    var _len3, args, _key3;

    var _ret = function () {
      for (_len3 = _arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        args[_key3 - 1] = _arguments[_key3];
      }

      var providers = [realm].concat(args);

      return {
        v: function v(hook) {
          var provider = hook.params.provider;

          if (realm === 'external' && provider || providers.indexOf(provider) !== -1) {
            throw new errors.MethodNotAllowed('Provider \'' + hook.params.provider + '\' can not call \'' + hook.method + '\'');
          }
        }
      };
    }();

    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
  }
}
},{"feathers-errors":11}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.isHookObject = isHookObject;
exports.processHooks = processHooks;
exports.addHookMethod = addHookMethod;

var _feathersCommons = require('feathers-commons');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function isHookObject(hookObject) {
  return (typeof hookObject === 'undefined' ? 'undefined' : _typeof(hookObject)) === 'object' && typeof hookObject.method === 'string' && (hookObject.type === 'before' || hookObject.type === 'after');
}

function processHooks(hooks, initialHookObject) {
  var _this = this;

  var hookObject = initialHookObject;
  var updateCurrentHook = function updateCurrentHook(current) {
    if (current) {
      if (!isHookObject(current)) {
        throw new Error(hookObject.type + ' hook for \'' + hookObject.method + '\' method returned invalid hook object');
      }

      hookObject = current;
    }

    return hookObject;
  };
  var promise = Promise.resolve(hookObject);

  // Go through all hooks and chain them into our promise
  hooks.forEach(function (fn) {
    var hook = fn.bind(_this);

    if (hook.length === 2) {
      // function(hook, next)
      promise = promise.then(function (hookObject) {
        return new Promise(function (resolve, reject) {
          hook(hookObject, function (error, result) {
            return error ? reject(error) : resolve(result);
          });
        });
      });
    } else {
      // function(hook)
      promise = promise.then(hook);
    }

    // Use the returned hook object or the old one
    promise = promise.then(updateCurrentHook);
  });

  return promise.catch(function (error) {
    // Add the hook information to any errors
    error.hook = hookObject;
    throw error;
  });
}

function addHookMethod(service, type, methods) {
  var prop = '__' + type + 'Hooks';

  // Initialize properties where hook functions are stored
  service[prop] = {};
  methods.forEach(function (method) {
    if (typeof service[method] === 'function') {
      service[prop][method] = [];
    }
  });

  // mixin the method (.before or .after)
  service.mixin(_defineProperty({}, type, function (obj) {
    var _this2 = this;

    var hooks = _feathersCommons.hooks.convertHookData(obj);

    methods.forEach(function (method) {
      if (typeof _this2[method] !== 'function') {
        return;
      }

      var myHooks = _this2[prop][method];

      if (hooks.all) {
        myHooks.push.apply(myHooks, hooks.all);
      }

      if (hooks[method]) {
        myHooks.push.apply(myHooks, hooks[method]);
      }
    });

    return this;
  }));
}
},{"feathers-commons":8}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _feathersCommons = require('feathers-commons');

var _bundled = require('./bundled');

var hooks = _interopRequireWildcard(_bundled);

var _commons = require('./commons');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function isPromise(result) {
  return typeof result !== 'undefined' && typeof result.then === 'function';
}

function hookMixin(service) {
  if (typeof service.mixin !== 'function') {
    return;
  }

  var app = this;
  var methods = app.methods;
  var oldBefore = service.before;
  var oldAfter = service.after;
  var mixin = {};

  (0, _commons.addHookMethod)(service, 'before', methods);
  (0, _commons.addHookMethod)(service, 'after', methods);

  methods.forEach(function (method) {
    if (typeof service[method] !== 'function') {
      return;
    }

    mixin[method] = function () {
      // A reference to the original method
      var _super = this._super.bind(this);
      // Create the hook object that gets passed through
      var hookObject = _feathersCommons.hooks.hookObject(method, 'before', arguments);

      hookObject.app = app;

      // Process all before hooks
      return _commons.processHooks.call(this, this.__beforeHooks[method], hookObject)
      // Use the hook object to call the original method
      .then(function (hookObject) {
        if (typeof hookObject.result !== 'undefined') {
          return Promise.resolve(hookObject);
        }

        return new Promise(function (resolve, reject) {
          var args = _feathersCommons.hooks.makeArguments(hookObject);
          // The method may not be normalized yet so we have to handle both
          // ways, either by callback or by Promise
          var callback = function callback(error, result) {
            if (error) {
              reject(error);
            } else {
              hookObject.result = result;
              resolve(hookObject);
            }
          };

          // We replace the callback with resolving the promise
          args.splice(args.length - 1, 1, callback);

          var result = _super.apply(undefined, _toConsumableArray(args));

          if (isPromise(result)) {
            result.then(function (data) {
              return callback(null, data);
            }, callback);
          }
        });
      })
      // Make a copy of hookObject from `before` hooks and update type
      .then(function (hookObject) {
        return Object.assign({}, hookObject, { type: 'after' });
      })
      // Run through all `after` hooks
      .then(_commons.processHooks.bind(this, this.__afterHooks[method]))
      // Finally, return the result
      .then(function (hookObject) {
        return hookObject.result;
      });
    };
  });

  service.mixin(mixin);

  // Before hooks that were registered in the service
  if (oldBefore) {
    service.before(oldBefore);
  }

  // After hooks that were registered in the service
  if (oldAfter) {
    service.after(oldAfter);
  }
}

function configure() {
  return function () {
    this.mixins.unshift(hookMixin);
  };
}

configure.lowerCase = hooks.lowerCase;
configure.remove = hooks.remove;
configure.disable = hooks.disable;

exports.default = configure;
module.exports = exports['default'];
},{"./bundled":12,"./commons":13,"feathers-commons":8}],15:[function(require,module,exports){
module.exports = require('./lib/client');

},{"./lib/client":16}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (connection) {
  if (!connection) {
    throw new Error('Primus connection needs to be provided');
  }

  var defaultService = function defaultService(name) {
    return new _client2.default({ name: name, connection: connection, method: 'send' });
  };

  var initialize = function initialize() {
    if (typeof this.defaultService === 'function') {
      throw new Error('Only one default client provider can be configured');
    }

    this.primus = connection;
    this.defaultService = defaultService;
  };

  initialize.Service = _client2.default;
  initialize.service = defaultService;

  return initialize;
};

var _client = require('feathers-socket-commons/client');

var _client2 = _interopRequireDefault(_client);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];
},{"feathers-socket-commons/client":28}],17:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"./lib/client":20,"dup":15}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _qs = require('qs');

var _qs2 = _interopRequireDefault(_qs);

var _feathersCommons = require('feathers-commons');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Base = function () {
  function Base(settings) {
    _classCallCheck(this, Base);

    this.name = (0, _feathersCommons.stripSlashes)(settings.name);
    this.options = settings.options;
    this.connection = settings.connection;
    this.base = settings.base + '/' + this.name;
  }

  _createClass(Base, [{
    key: 'makeUrl',
    value: function makeUrl(params, id) {
      params = params || {};
      var url = this.base;

      if (typeof id !== 'undefined') {
        url += '/' + id;
      }

      if (Object.keys(params).length !== 0) {
        var queryString = _qs2.default.stringify(params);

        url += '?' + queryString;
      }

      return url;
    }
  }, {
    key: 'find',
    value: function find() {
      var params = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      return this.request({
        url: this.makeUrl(params.query),
        method: 'GET',
        headers: _extends({}, params.headers)
      });
    }
  }, {
    key: 'get',
    value: function get(id) {
      var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return this.request({
        url: this.makeUrl(params.query, id),
        method: 'GET',
        headers: _extends({}, params.headers)
      });
    }
  }, {
    key: 'create',
    value: function create(body) {
      var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return this.request({
        url: this.makeUrl(params.query),
        body: body,
        method: 'POST',
        headers: _extends({ 'Content-Type': 'application/json' }, params.headers)
      });
    }
  }, {
    key: 'update',
    value: function update(id, body) {
      var params = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      return this.request({
        url: this.makeUrl(params.query, id),
        body: body,
        method: 'PUT',
        headers: _extends({ 'Content-Type': 'application/json' }, params.headers)
      });
    }
  }, {
    key: 'patch',
    value: function patch(id, body) {
      var params = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      return this.request({
        url: this.makeUrl(params.query, id),
        body: body,
        method: 'PATCH',
        headers: _extends({ 'Content-Type': 'application/json' }, params.headers)
      });
    }
  }, {
    key: 'remove',
    value: function remove(id) {
      var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return this.request({
        url: this.makeUrl(params.query, id),
        method: 'DELETE',
        headers: _extends({}, params.headers)
      });
    }
  }]);

  return Base;
}();

exports.default = Base;
module.exports = exports['default'];
},{"feathers-commons":8,"qs":24}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _base = require('./base');

var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Service = function (_Base) {
  _inherits(Service, _Base);

  function Service() {
    _classCallCheck(this, Service);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Service).apply(this, arguments));
  }

  _createClass(Service, [{
    key: 'request',
    value: function request(options) {
      var _this2 = this;

      var fetchOptions = _extends({}, options);

      if (options.body) {
        fetchOptions.body = JSON.stringify(options.body);
      }

      return new Promise(function (resolve, reject) {
        _this2.connection(options.url, fetchOptions).then(_this2.checkStatus).then(_this2.parseJSON).then(resolve).catch(reject);
      });
    }
  }, {
    key: 'checkStatus',
    value: function checkStatus(response) {
      if (response.ok) {
        return response;
      }

      var error = new Error(response.statusText);
      error.code = response.status;
      error.response = response;
      throw error;
    }
  }, {
    key: 'parseJSON',
    value: function parseJSON(response) {
      return response.json();
    }
  }]);

  return Service;
}(_base2.default);

exports.default = Service;
module.exports = exports['default'];
},{"./base":18}],20:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  var base = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

  var result = {};

  Object.keys(transports).forEach(function (key) {
    var Service = transports[key];

    result[key] = function (connection) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (!connection) {
        throw new Error(key + ' has to be provided to feathers-rest');
      }

      var defaultService = function defaultService(name) {
        return new Service({ base: base, name: name, connection: connection, options: options });
      };

      var initialize = function initialize() {
        if (typeof this.defaultService === 'function') {
          throw new Error('Only one default client provider can be configured');
        }

        this.rest = connection;
        this.defaultService = defaultService;
      };

      initialize.Service = Service;
      initialize.service = defaultService;

      return initialize;
    };
  });

  return result;
};

var _jquery = require('./jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _superagent = require('./superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _request = require('./request');

var _request2 = _interopRequireDefault(_request);

var _fetch = require('./fetch');

var _fetch2 = _interopRequireDefault(_fetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var transports = {
  jquery: _jquery2.default,
  superagent: _superagent2.default,
  request: _request2.default,
  fetch: _fetch2.default
};

module.exports = exports['default'];
},{"./fetch":19,"./jquery":21,"./request":22,"./superagent":23}],21:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _base = require('./base');

var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Service = function (_Base) {
  _inherits(Service, _Base);

  function Service() {
    _classCallCheck(this, Service);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Service).apply(this, arguments));
  }

  _createClass(Service, [{
    key: 'request',
    value: function request(options) {
      var _this2 = this;

      var opts = _extends({
        dataType: options.type || 'json'
      }, options);

      if (options.body) {
        opts.data = JSON.stringify(options.body);
        opts.contentType = 'application/json';
      }

      delete opts.type;
      delete opts.body;

      return new Promise(function (resolve, reject) {
        _this2.connection.ajax(opts).then(resolve, function (xhr) {
          var error = new Error(xhr.responseText);
          error.xhr = xhr;
          reject(error);
        });
      });
    }
  }]);

  return Service;
}(_base2.default);

exports.default = Service;
module.exports = exports['default'];
},{"./base":18}],22:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _base = require('./base');

var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Service = function (_Base) {
  _inherits(Service, _Base);

  function Service() {
    _classCallCheck(this, Service);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Service).apply(this, arguments));
  }

  _createClass(Service, [{
    key: 'request',
    value: function request(options) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2.connection(_extends({
          json: true
        }, options), function (error, res, data) {
          if (error) {
            return reject(error);
          }

          if (!error && res.statusCode >= 400) {
            return reject(new Error(data));
          }

          resolve(data);
        });
      });
    }
  }]);

  return Service;
}(_base2.default);

exports.default = Service;
module.exports = exports['default'];
},{"./base":18}],23:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _base = require('./base');

var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Service = function (_Base) {
  _inherits(Service, _Base);

  function Service() {
    _classCallCheck(this, Service);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Service).apply(this, arguments));
  }

  _createClass(Service, [{
    key: 'request',
    value: function request(options) {
      var superagent = this.connection(options.method, options.url).type(options.type || 'json');

      return new Promise(function (resolve, reject) {
        superagent.set(options.headers);

        if (options.body) {
          superagent.send(options.body);
        }

        superagent.end(function (error, res) {
          if (error) {
            return reject(error);
          }

          resolve(res && res.body);
        });
      });
    }
  }]);

  return Service;
}(_base2.default);

exports.default = Service;
module.exports = exports['default'];
},{"./base":18}],24:[function(require,module,exports){
'use strict';

var Stringify = require('./stringify');
var Parse = require('./parse');

module.exports = {
    stringify: Stringify,
    parse: Parse
};

},{"./parse":25,"./stringify":26}],25:[function(require,module,exports){
'use strict';

var Utils = require('./utils');

var internals = {
    delimiter: '&',
    depth: 5,
    arrayLimit: 20,
    parameterLimit: 1000,
    strictNullHandling: false,
    plainObjects: false,
    allowPrototypes: false,
    allowDots: false
};

internals.parseValues = function (str, options) {
    var obj = {};
    var parts = str.split(options.delimiter, options.parameterLimit === Infinity ? undefined : options.parameterLimit);

    for (var i = 0; i < parts.length; ++i) {
        var part = parts[i];
        var pos = part.indexOf(']=') === -1 ? part.indexOf('=') : part.indexOf(']=') + 1;

        if (pos === -1) {
            obj[Utils.decode(part)] = '';

            if (options.strictNullHandling) {
                obj[Utils.decode(part)] = null;
            }
        } else {
            var key = Utils.decode(part.slice(0, pos));
            var val = Utils.decode(part.slice(pos + 1));

            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                obj[key] = [].concat(obj[key]).concat(val);
            } else {
                obj[key] = val;
            }
        }
    }

    return obj;
};

internals.parseObject = function (chain, val, options) {
    if (!chain.length) {
        return val;
    }

    var root = chain.shift();

    var obj;
    if (root === '[]') {
        obj = [];
        obj = obj.concat(internals.parseObject(chain, val, options));
    } else {
        obj = options.plainObjects ? Object.create(null) : {};
        var cleanRoot = root[0] === '[' && root[root.length - 1] === ']' ? root.slice(1, root.length - 1) : root;
        var index = parseInt(cleanRoot, 10);
        if (
            !isNaN(index) &&
            root !== cleanRoot &&
            String(index) === cleanRoot &&
            index >= 0 &&
            (options.parseArrays && index <= options.arrayLimit)
        ) {
            obj = [];
            obj[index] = internals.parseObject(chain, val, options);
        } else {
            obj[cleanRoot] = internals.parseObject(chain, val, options);
        }
    }

    return obj;
};

internals.parseKeys = function (givenKey, val, options) {
    if (!givenKey) {
        return;
    }

    // Transform dot notation to bracket notation
    var key = options.allowDots ? givenKey.replace(/\.([^\.\[]+)/g, '[$1]') : givenKey;

    // The regex chunks

    var parent = /^([^\[\]]*)/;
    var child = /(\[[^\[\]]*\])/g;

    // Get the parent

    var segment = parent.exec(key);

    // Stash the parent if it exists

    var keys = [];
    if (segment[1]) {
        // If we aren't using plain objects, optionally prefix keys
        // that would overwrite object prototype properties
        if (!options.plainObjects && Object.prototype.hasOwnProperty(segment[1])) {
            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(segment[1]);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while ((segment = child.exec(key)) !== null && i < options.depth) {
        i += 1;
        if (!options.plainObjects && Object.prototype.hasOwnProperty(segment[1].replace(/\[|\]/g, ''))) {
            if (!options.allowPrototypes) {
                continue;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return internals.parseObject(keys, val, options);
};

module.exports = function (str, opts) {
    var options = opts || {};
    options.delimiter = typeof options.delimiter === 'string' || Utils.isRegExp(options.delimiter) ? options.delimiter : internals.delimiter;
    options.depth = typeof options.depth === 'number' ? options.depth : internals.depth;
    options.arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : internals.arrayLimit;
    options.parseArrays = options.parseArrays !== false;
    options.allowDots = typeof options.allowDots === 'boolean' ? options.allowDots : internals.allowDots;
    options.plainObjects = typeof options.plainObjects === 'boolean' ? options.plainObjects : internals.plainObjects;
    options.allowPrototypes = typeof options.allowPrototypes === 'boolean' ? options.allowPrototypes : internals.allowPrototypes;
    options.parameterLimit = typeof options.parameterLimit === 'number' ? options.parameterLimit : internals.parameterLimit;
    options.strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : internals.strictNullHandling;

    if (
        str === '' ||
        str === null ||
        typeof str === 'undefined'
    ) {
        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? internals.parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var newObj = internals.parseKeys(key, tempObj[key], options);
        obj = Utils.merge(obj, newObj, options);
    }

    return Utils.compact(obj);
};

},{"./utils":27}],26:[function(require,module,exports){
'use strict';

var Utils = require('./utils');

var internals = {
    delimiter: '&',
    arrayPrefixGenerators: {
        brackets: function (prefix) {
            return prefix + '[]';
        },
        indices: function (prefix, key) {
            return prefix + '[' + key + ']';
        },
        repeat: function (prefix) {
            return prefix;
        }
    },
    strictNullHandling: false,
    skipNulls: false,
    encode: true
};

internals.stringify = function (object, prefix, generateArrayPrefix, strictNullHandling, skipNulls, encode, filter, sort, allowDots) {
    var obj = object;
    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    } else if (Utils.isBuffer(obj)) {
        obj = String(obj);
    } else if (obj instanceof Date) {
        obj = obj.toISOString();
    } else if (obj === null) {
        if (strictNullHandling) {
            return encode ? Utils.encode(prefix) : prefix;
        }

        obj = '';
    }

    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
        if (encode) {
            return [Utils.encode(prefix) + '=' + Utils.encode(obj)];
        }
        return [prefix + '=' + obj];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys;
    if (Array.isArray(filter)) {
        objKeys = filter;
    } else {
        var keys = Object.keys(obj);
        objKeys = sort ? keys.sort(sort) : keys;
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }

        if (Array.isArray(obj)) {
            values = values.concat(internals.stringify(obj[key], generateArrayPrefix(prefix, key), generateArrayPrefix, strictNullHandling, skipNulls, encode, filter, sort, allowDots));
        } else {
            values = values.concat(internals.stringify(obj[key], prefix + (allowDots ? '.' + key : '[' + key + ']'), generateArrayPrefix, strictNullHandling, skipNulls, encode, filter, sort, allowDots));
        }
    }

    return values;
};

module.exports = function (object, opts) {
    var obj = object;
    var options = opts || {};
    var delimiter = typeof options.delimiter === 'undefined' ? internals.delimiter : options.delimiter;
    var strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : internals.strictNullHandling;
    var skipNulls = typeof options.skipNulls === 'boolean' ? options.skipNulls : internals.skipNulls;
    var encode = typeof options.encode === 'boolean' ? options.encode : internals.encode;
    var sort = typeof options.sort === 'function' ? options.sort : null;
    var allowDots = typeof options.allowDots === 'undefined' ? false : options.allowDots;
    var objKeys;
    var filter;
    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    } else if (Array.isArray(options.filter)) {
        objKeys = filter = options.filter;
    }

    var keys = [];

    if (typeof obj !== 'object' || obj === null) {
        return '';
    }

    var arrayFormat;
    if (options.arrayFormat in internals.arrayPrefixGenerators) {
        arrayFormat = options.arrayFormat;
    } else if ('indices' in options) {
        arrayFormat = options.indices ? 'indices' : 'repeat';
    } else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = internals.arrayPrefixGenerators[arrayFormat];

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }

    if (sort) {
        objKeys.sort(sort);
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }

        keys = keys.concat(internals.stringify(obj[key], key, generateArrayPrefix, strictNullHandling, skipNulls, encode, filter, sort, allowDots));
    }

    return keys.join(delimiter);
};

},{"./utils":27}],27:[function(require,module,exports){
'use strict';

var hexTable = (function () {
    var array = new Array(256);
    for (var i = 0; i < 256; ++i) {
        array[i] = '%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase();
    }

    return array;
}());

exports.arrayToObject = function (source, options) {
    var obj = options.plainObjects ? Object.create(null) : {};
    for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== 'undefined') {
            obj[i] = source[i];
        }
    }

    return obj;
};

exports.merge = function (target, source, options) {
    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (Array.isArray(target)) {
            target.push(source);
        } else if (typeof target === 'object') {
            target[source] = true;
        } else {
            return [target, source];
        }

        return target;
    }

    if (typeof target !== 'object') {
        return [target].concat(source);
    }

    var mergeTarget = target;
    if (Array.isArray(target) && !Array.isArray(source)) {
        mergeTarget = exports.arrayToObject(target, options);
    }

	return Object.keys(source).reduce(function (acc, key) {
        var value = source[key];

        if (Object.prototype.hasOwnProperty.call(acc, key)) {
            acc[key] = exports.merge(acc[key], value, options);
        } else {
            acc[key] = value;
        }
		return acc;
    }, mergeTarget);
};

exports.decode = function (str) {
    try {
        return decodeURIComponent(str.replace(/\+/g, ' '));
    } catch (e) {
        return str;
    }
};

exports.encode = function (str) {
    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    var string = typeof str === 'string' ? str : String(str);

    var out = '';
    for (var i = 0; i < string.length; ++i) {
        var c = string.charCodeAt(i);

        if (
            c === 0x2D || // -
            c === 0x2E || // .
            c === 0x5F || // _
            c === 0x7E || // ~
            (c >= 0x30 && c <= 0x39) || // 0-9
            (c >= 0x41 && c <= 0x5A) || // a-z
            (c >= 0x61 && c <= 0x7A) // A-Z
        ) {
            out += string.charAt(i);
            continue;
        }

        if (c < 0x80) {
            out = out + hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        i += 1;
        c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
        out += (hexTable[0xF0 | (c >> 18)] + hexTable[0x80 | ((c >> 12) & 0x3F)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
    }

    return out;
};

exports.compact = function (obj, references) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    var refs = references || [];
    var lookup = refs.indexOf(obj);
    if (lookup !== -1) {
        return refs[lookup];
    }

    refs.push(obj);

    if (Array.isArray(obj)) {
        var compacted = [];

        for (var i = 0; i < obj.length; ++i) {
            if (typeof obj[i] !== 'undefined') {
                compacted.push(obj[i]);
            }
        }

        return compacted;
    }

    var keys = Object.keys(obj);
    for (var j = 0; j < keys.length; ++j) {
        var key = keys[j];
        obj[key] = exports.compact(obj[key], refs);
    }

    return obj;
};

exports.isRegExp = function (obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

exports.isBuffer = function (obj) {
    if (obj === null || typeof obj === 'undefined') {
        return false;
    }

    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};

},{}],28:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"./lib/client":29,"dup":15}],29:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('./utils');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Service = function () {
  function Service(options) {
    _classCallCheck(this, Service);

    this.events = _utils.events;
    this.path = options.name;
    this.connection = options.connection;
    this.method = options.method;
  }

  _createClass(Service, [{
    key: 'emit',
    value: function emit() {
      var _connection;

      (_connection = this.connection)[this.method].apply(_connection, arguments);
    }
  }, {
    key: 'send',
    value: function send(method) {
      var _this = this;

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var callback = null;
      if (typeof args[args.length - 1] === 'function') {
        callback = args.pop();
      }

      return new Promise(function (resolve, reject) {
        var _connection2;

        args.unshift(_this.path + '::' + method);
        args.push(function (error, data) {
          if (callback) {
            callback(error, data);
          }

          return error ? reject(error) : resolve(data);
        });

        (_connection2 = _this.connection)[_this.method].apply(_connection2, args);
      });
    }
  }, {
    key: 'find',
    value: function find() {
      var params = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      return this.send('find', params.query || {});
    }
  }, {
    key: 'get',
    value: function get(id) {
      var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return this.send('get', id, params.query || {});
    }
  }, {
    key: 'create',
    value: function create(data) {
      var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return this.send('create', data, params.query || {});
    }
  }, {
    key: 'update',
    value: function update(id, data) {
      var params = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      return this.send('update', id, data, params.query || {});
    }
  }, {
    key: 'patch',
    value: function patch(id, data) {
      var params = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      return this.send('patch', id, data, params.query || {});
    }
  }, {
    key: 'remove',
    value: function remove(id) {
      var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return this.send('remove', id, params.query || {});
    }
  }]);

  return Service;
}();

exports.default = Service;


var emitterMethods = ['on', 'once', 'off'];

emitterMethods.forEach(function (method) {
  Service.prototype[method] = function (name, callback) {
    this.connection[method](this.path + ' ' + name, callback);
  };
});
module.exports = exports['default'];
},{"./utils":30}],30:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.events = exports.eventMappings = undefined;
exports.convertFilterData = convertFilterData;
exports.promisify = promisify;
exports.errorObject = errorObject;

var _feathersCommons = require('feathers-commons');

var eventMappings = exports.eventMappings = {
  create: 'created',
  update: 'updated',
  patch: 'patched',
  remove: 'removed'
};

var events = exports.events = Object.keys(eventMappings).map(function (method) {
  return eventMappings[method];
});

function convertFilterData(obj) {
  return _feathersCommons.hooks.convertHookData(obj);
}

function promisify(method, context) {
  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  return new Promise(function (resolve, reject) {
    method.apply(context, args.concat(function (error, result) {
      if (error) {
        return reject(error);
      }

      resolve(result);
    }));
  });
}

function errorObject(e) {
  var result = {};
  Object.getOwnPropertyNames(e).forEach(function (key) {
    return result[key] = e[key];
  });
  return result;
}
},{"feathers-commons":8}],31:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"./lib/client":32,"dup":15}],32:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (connection) {
  if (!connection) {
    throw new Error('Socket.io connection needs to be provided');
  }

  var defaultService = function defaultService(name) {
    return new _client2.default({ name: name, connection: connection, method: 'emit' });
  };

  var initialize = function initialize() {
    if (typeof this.defaultService === 'function') {
      throw new Error('Only one default client provider can be configured');
    }

    this.io = connection;
    this.defaultService = defaultService;
  };

  initialize.Service = _client2.default;
  initialize.service = defaultService;

  return initialize;
};

var _client = require('feathers-socket-commons/client');

var _client2 = _interopRequireDefault(_client);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];
},{"feathers-socket-commons/client":28}],33:[function(require,module,exports){
module.exports = require('./lib/client/index');

},{"./lib/client/index":36}],34:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _feathersCommons = require('feathers-commons');

var _uberproto = require('uberproto');

var _uberproto2 = _interopRequireDefault(_uberproto);

var _index = require('./mixins/index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('feathers:application');
var methods = ['find', 'get', 'create', 'update', 'patch', 'remove'];
var Proto = _uberproto2.default.extend({
  create: null
});

exports.default = {
  init: function init() {
    Object.assign(this, {
      methods: methods,
      mixins: (0, _index2.default)(),
      services: {},
      providers: [],
      _setup: false
    });
  },
  service: function service(location, _service) {
    var _this = this;

    var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    location = (0, _feathersCommons.stripSlashes)(location);

    if (!_service) {
      var current = this.services[location];

      if (typeof current === 'undefined' && typeof this.defaultService === 'function') {
        return this.service(location, this.defaultService(location), options);
      }

      return current;
    }

    var protoService = Proto.extend(_service);

    debug('Registering new service at `' + location + '`');

    // Add all the mixins
    this.mixins.forEach(function (fn) {
      return fn.call(_this, protoService);
    });

    if (typeof protoService._setup === 'function') {
      protoService._setup(this, location);
    }

    // Run the provider functions to register the service
    this.providers.forEach(function (provider) {
      return provider.call(_this, location, protoService, options);
    });

    // If we ran setup already, set this service up explicitly
    if (this._isSetup && typeof protoService.setup === 'function') {
      debug('Setting up service for `' + location + '`');
      protoService.setup(this, location);
    }

    return this.services[location] = protoService;
  },
  use: function use(location) {
    var service = undefined,
        middleware = Array.from(arguments).slice(1).reduce(function (middleware, arg) {
      if (typeof arg === 'function') {
        middleware[service ? 'after' : 'before'].push(arg);
      } else if (!service) {
        service = arg;
      } else {
        throw new Error('invalid arg passed to app.use');
      }
      return middleware;
    }, {
      before: [],
      after: []
    });

    var hasMethod = function hasMethod(methods) {
      return methods.some(function (name) {
        return service && typeof service[name] === 'function';
      });
    };

    // Check for service (any object with at least one service method)
    if (hasMethod(['handle', 'set']) || !hasMethod(this.methods)) {
      return this._super.apply(this, arguments);
    }

    // Any arguments left over are other middleware that we want to pass to the providers
    this.service(location, service, { middleware: middleware });

    return this;
  },
  setup: function setup() {
    var _this2 = this;

    // Setup each service (pass the app so that they can look up other services etc.)
    Object.keys(this.services).forEach(function (path) {
      var service = _this2.services[path];

      debug('Setting up service for `' + path + '`');
      if (typeof service.setup === 'function') {
        service.setup(_this2, path);
      }
    });

    this._isSetup = true;

    return this;
  },


  // Express 3.x configure is gone in 4.x but we'll keep a more basic version
  // That just takes a function in order to keep Feathers plugin configuration easier.
  // Environment specific configurations should be done as suggested in the 4.x migration guide:
  // https://github.com/visionmedia/express/wiki/Migrating-from-3.x-to-4.x
  configure: function configure(fn) {
    fn.call(this);

    return this;
  },
  listen: function listen() {
    var server = this._super.apply(this, arguments);

    this.setup(server);
    debug('Feathers application listening');

    return server;
  }
};
module.exports = exports['default'];
},{"./mixins/index":39,"debug":5,"feathers-commons":8,"uberproto":46}],35:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  var app = {
    settings: {},

    get: function get(name) {
      return this.settings[name];
    },
    set: function set(name, value) {
      this.settings[name] = value;
      return this;
    },
    disable: function disable(name) {
      this.settings[name] = false;
      return this;
    },
    disabled: function disabled(name) {
      return !this.settings[name];
    },
    enable: function enable(name) {
      this.settings[name] = true;
      return this;
    },
    enabled: function enabled(name) {
      return !!this.settings[name];
    },
    use: function use() {
      throw new Error('Middleware functions can not be used in the Feathers client');
    },
    listen: function listen() {
      return {};
    }
  };

  _uberproto2.default.mixin(_events.EventEmitter.prototype, app);

  return app;
};

var _events = require('events');

var _uberproto = require('uberproto');

var _uberproto2 = _interopRequireDefault(_uberproto);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];
},{"events":4,"uberproto":46}],36:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createApplication;

var _feathers = require('../feathers');

var _feathers2 = _interopRequireDefault(_feathers);

var _express = require('./express');

var _express2 = _interopRequireDefault(_express);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createApplication() {
  return (0, _feathers2.default)(_express2.default.apply(undefined, arguments));
}

createApplication.version = require('../../package.json').version;
module.exports = exports['default'];
},{"../../package.json":42,"../feathers":37,"./express":35}],37:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createApplication;

var _uberproto = require('uberproto');

var _uberproto2 = _interopRequireDefault(_uberproto);

var _application = require('./application');

var _application2 = _interopRequireDefault(_application);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Create a Feathers application that extends Express.
 *
 * @return {Function}
 * @api public
 */
function createApplication(app) {
  _uberproto2.default.mixin(_application2.default, app);
  app.init();
  return app;
}
module.exports = exports['default'];
},{"./application":34,"uberproto":46}],38:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (service) {
  var isEmitter = typeof service.on === 'function' && typeof service.emit === 'function';
  var emitter = service._rubberDuck = _rubberduck2.default.emitter(service);

  if (typeof service.mixin === 'function' && !isEmitter) {
    service.mixin(_events.EventEmitter.prototype);
  }

  service._serviceEvents = Array.isArray(service.events) ? service.events.slice() : [];

  // Pass the Rubberduck error event through
  // TODO deal with error events properly
  emitter.on('error', function (errors) {
    service.emit('serviceError', errors[0]);
  });

  Object.keys(eventMappings).forEach(function (method) {
    var event = eventMappings[method];
    var alreadyEmits = service._serviceEvents.indexOf(event) !== -1;

    if (typeof service[method] === 'function' && !alreadyEmits) {
      // The Rubberduck event name (e.g. afterCreate, afterUpdate or afterDestroy)
      var eventName = 'after' + upperCase(method);
      service._serviceEvents.push(event);
      // Punch the given method
      emitter.punch(method, -1);
      // Pass the event and error event through
      emitter.on(eventName, function (results, args) {
        if (!results[0]) {
          (function () {
            // callback without error
            var hook = hookObject(method, 'after', args);
            var data = Array.isArray(results[1]) ? results[1] : [results[1]];

            data.forEach(function (current) {
              return service.emit(event, current, hook);
            });
          })();
        } else {
          service.emit('serviceError', results[0]);
        }
      });
    }
  });
};

var _rubberduck = require('rubberduck');

var _rubberduck2 = _interopRequireDefault(_rubberduck);

var _events = require('events');

var _feathersCommons = require('feathers-commons');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var hookObject = _feathersCommons.hooks.hookObject;
var eventMappings = {
  create: 'created',
  update: 'updated',
  remove: 'removed',
  patch: 'patched'
};

function upperCase(name) {
  return name.charAt(0).toUpperCase() + name.substring(1);
}

module.exports = exports['default'];
},{"events":4,"feathers-commons":8,"rubberduck":44}],39:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  var mixins = [require('./promise'), require('./event'), require('./normalizer')];

  // Override push to make sure that normalize is always the last
  mixins.push = function () {
    var args = [this.length - 1, 0].concat(Array.from(arguments));
    this.splice.apply(this, args);
    return this.length;
  };

  return mixins;
};

module.exports = exports['default'];
},{"./event":38,"./normalizer":40,"./promise":41}],40:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (service) {
  var _this = this;

  if (typeof service.mixin === 'function') {
    (function () {
      var mixin = {};

      _this.methods.forEach(function (method) {
        if (typeof service[method] === 'function') {
          mixin[method] = function () {
            return this._super.apply(this, (0, _feathersCommons.getArguments)(method, arguments));
          };
        }
      });

      service.mixin(mixin);
    })();
  }
};

var _feathersCommons = require('feathers-commons');

module.exports = exports['default'];
},{"feathers-commons":8}],41:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (service) {
  var _this = this;

  if (typeof service.mixin === 'function') {
    (function () {
      var mixin = {};

      _this.methods.forEach(function (method) {
        if (typeof service[method] === 'function') {
          mixin[method] = wrapper;
        }
      });

      service.mixin(mixin);
    })();
  }
};

function isPromise(result) {
  return typeof result !== 'undefined' && typeof result.then === 'function';
}

function wrapper() {
  var result = this._super.apply(this, arguments);
  var callback = arguments[arguments.length - 1];

  if (typeof callback === 'function' && isPromise(result)) {
    result.then(function (data) {
      return callback(null, data);
    }, function (error) {
      return callback(error);
    });
  }
  return result;
}

module.exports = exports['default'];
},{}],42:[function(require,module,exports){
module.exports={
  "_args": [
    [
      "feathers@^2.0.0-pre.1",
      "/Users/Curtis/Play/feathers-client"
    ]
  ],
  "_from": "feathers@>=2.0.0-pre.1 <3.0.0",
  "_id": "feathers@2.0.0",
  "_inCache": true,
  "_installable": true,
  "_location": "/feathers",
  "_nodeVersion": "5.6.0",
  "_npmOperationalInternal": {
    "host": "packages-5-east.internal.npmjs.com",
    "tmp": "tmp/feathers-2.0.0.tgz_1456123682541_0.35575417522341013"
  },
  "_npmUser": {
    "email": "daff@neyeon.de",
    "name": "daffl"
  },
  "_npmVersion": "3.6.0",
  "_phantomChildren": {},
  "_requested": {
    "name": "feathers",
    "raw": "feathers@^2.0.0-pre.1",
    "rawSpec": "^2.0.0-pre.1",
    "scope": null,
    "spec": ">=2.0.0-pre.1 <3.0.0",
    "type": "range"
  },
  "_requiredBy": [
    "/"
  ],
  "_resolved": "https://registry.npmjs.org/feathers/-/feathers-2.0.0.tgz",
  "_shasum": "0ff06df8fd72271c25e6d1b4117b9e7721cfe370",
  "_shrinkwrap": null,
  "_spec": "feathers@^2.0.0-pre.1",
  "_where": "/Users/Curtis/Play/feathers-client",
  "author": {
    "email": "hello@feathersjs.com",
    "name": "Feathers",
    "url": "http://feathersjs.com"
  },
  "browser": {
    "./lib/index": "./lib/client/index"
  },
  "bugs": {
    "url": "https://github.com/feathersjs/feathers/issues"
  },
  "contributors": [
    {
      "name": "Eric Kryski",
      "email": "e.kryski@gmail.com",
      "url": "http://erickryski.com"
    },
    {
      "name": "David Luecke",
      "email": "daff@neyeon.de",
      "url": "http://neyeon.com"
    }
  ],
  "dependencies": {
    "babel-polyfill": "^6.3.14",
    "debug": "^2.1.1",
    "events": "^1.1.0",
    "express": "^4.12.3",
    "feathers-commons": "^0.7.0",
    "rubberduck": "^1.0.0",
    "uberproto": "^1.2.0"
  },
  "description": "Build Better APIs, Faster than Ever.",
  "devDependencies": {
    "babel-cli": "^6.3.17",
    "babel-core": "^6.3.26",
    "babel-plugin-add-module-exports": "^0.1.2",
    "babel-preset-es2015": "^6.3.13",
    "body-parser": "^1.13.2",
    "feathers-client": "^0.5.1",
    "feathers-rest": "^1.1.0",
    "feathers-socketio": "^1.1.0",
    "istanbul": "^0.4.0",
    "jshint": "^2.6.3",
    "mocha": "^2.2.0",
    "nsp": "^2.2.0",
    "q": "^1.0.1",
    "request": "^2.x",
    "socket.io-client": "^1.0.0"
  },
  "directories": {
    "lib": "lib"
  },
  "dist": {
    "shasum": "0ff06df8fd72271c25e6d1b4117b9e7721cfe370",
    "tarball": "http://registry.npmjs.org/feathers/-/feathers-2.0.0.tgz"
  },
  "engines": {
    "node": ">= 0.10.0",
    "npm": ">= 1.3.0"
  },
  "gitHead": "5a05f04928c920761e00fb564a0cec6a65272359",
  "homepage": "http://feathersjs.com",
  "keywords": [
    "REST",
    "feathers",
    "realtime",
    "socket.io"
  ],
  "license": "MIT",
  "main": "lib/index",
  "maintainers": [
    {
      "name": "ekryski",
      "email": "e.kryski@gmail.com"
    },
    {
      "name": "daffl",
      "email": "daff@neyeon.de"
    }
  ],
  "name": "feathers",
  "optionalDependencies": {},
  "readme": "ERROR: No README data found!",
  "repository": {
    "type": "git",
    "url": "git://github.com/feathersjs/feathers.git"
  },
  "scripts": {
    "compile": "rm -rf lib/ && babel -d lib/ src/",
    "coverage": "istanbul cover _mocha -- test/ --recursive",
    "jshint": "jshint src/. test/. --config",
    "mocha": "mocha test/ --compilers js:babel-core/register --recursive",
    "prepublish": "npm run compile",
    "publish": "git push origin && git push origin --tags",
    "release:major": "npm version major && npm publish",
    "release:minor": "npm version minor && npm publish",
    "release:patch": "npm version patch && npm publish",
    "release:prerelease": "npm version prerelease && npm publish --tag pegasus",
    "test": "npm run compile && npm run jshint && npm run mocha && nsp check",
    "watch": "babel --watch -d lib/ src/"
  },
  "version": "2.0.0"
}

},{}],43:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = '' + str;
  if (str.length > 10000) return;
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],44:[function(require,module,exports){
var events = require('events');
var utils = require('./utils');
var wrap = exports.wrap = {
  /**
   * Wrap an anonymous or named function to notify an Emitter and
   * return the wrapper function.
   * @param {events.EventEmitter} emitter The emitter to notify
   * @param {Function} fn The function to wrap
   * @param {String} name The optional name
   */
  fn: function(emitter, fn, strict, name, scope) {
    var wrapped = function() {
      var result;
      utils.emitEvents(emitter, 'before', name, [arguments, this, name]);

      try {
        result = fn.apply(scope || this, arguments);
      } catch (e) {
        utils.emitEvents(emitter, 'error', name, [ e, arguments, this, name ]);
        throw e;
      }

      utils.emitEvents(emitter, 'after', name, [ result, arguments, this, name ]);
      return result;
    };

    if (strict) {
      eval('wrapped = ' + utils.addArgs(wrapped.toString(), fn.length));
    }

    return wrapped;
  },
  /**
   * Wrap an anonymous or named function that calls a callback asynchronously
   * to notify an Emitter and return the wrapper function.
   * @param {events.EventEmitter} emitter The emitter to notify
   * @param {Function} fn The function to wrap
   * @param {Integer} position The position of the callback in the arguments
   * array (defaults to 0). Set to -1 if the callback is the last argument.
   * @param {String} name The optional name
   */
  async: function(emitter, fn, position, strict, name, scope) {
    var wrapped = function() {
      var pos = position == -1 ? arguments.length - 1 : (position || 0);
      var callback = arguments[pos];
      var context = this;
      var methodArgs = arguments;
      var callbackWrapper = function() {
        try {
          callback.apply(callback, arguments);
        } catch (e) {
          utils.emitEvents(emitter, 'error', name, [ e, methodArgs, context, name ]);
          throw e;
        }
        var eventType = arguments[0] instanceof Error ? 'error' : 'after';
        utils.emitEvents(emitter, eventType, name, [ arguments, methodArgs, context, name ]);
      };

      utils.emitEvents(emitter, 'before', name, [ methodArgs, this, name ]);
      methodArgs[pos] = callbackWrapper;

      try {
        return fn.apply(scope || this, methodArgs);
      } catch (e) {
        utils.emitEvents(emitter, 'error', name, [ e, methodArgs, context, name ]);
        throw e;
      }
    };

    if (strict) {
      eval('wrapped = ' + utils.addArgs(wrapped.toString(), fn.length));
    }

    return wrapped;
  }
};

var Emitter = exports.Emitter = function(obj) {
  this.obj = obj;
};

Emitter.prototype = Object.create(events.EventEmitter.prototype);

/**
 * Punch a method with the given name, with
 * @param {String | Array} method The name of the method or a list of
 * method names.
 * @param {Integer} position The optional position of the asynchronous callback
 * in the arguments list.
 */
Emitter.prototype.punch = function(method, position, strict) {
  if (Array.isArray(method)) {
    var self = this;
    method.forEach(function(method) {
      self.punch(method, position, strict);
    });
  } else {
    var old = this.obj[method];
    if (typeof old == 'function') {
      this.obj[method] = (!position && position !== 0) ?
        wrap.fn(this, old, strict, method) :
        wrap.async(this, old, position, strict, method);
    }
  }
  return this;
};

exports.emitter = function(obj) {
  return new Emitter(obj);
};

},{"./utils":45,"events":4}],45:[function(require,module,exports){
exports.toBase26 = function(num) {
  var outString = '';
  var letters = 'abcdefghijklmnopqrstuvwxyz';
  while (num > 25) {
    var remainder = num % 26;
    outString = letters.charAt(remainder) + outString;
    num = Math.floor(num / 26) - 1;
  }
  outString = letters.charAt(num) + outString;
  return outString;
};

exports.makeFakeArgs = function(len) {
  var argArr = [];
  for (var i = 0; i < len; i++) {
    argArr.push(exports.toBase26(i));
  }
  return argArr.join(",");
};

exports.addArgs = function(fnString, argLen) {
  return fnString.replace(/function\s*\(\)/, 'function(' + exports.makeFakeArgs(argLen) + ')');
};

exports.emitEvents = function(emitter, type, name, args) {
  var ucName = name ? name.replace(/^\w/, function(first) {
    return first.toUpperCase();
  }) : null;

  emitter.emit.apply(emitter, [type].concat(args));
  if (ucName) {
    emitter.emit.apply(emitter, [type + ucName].concat(args));
  }
};

},{}],46:[function(require,module,exports){
/* global define */
/**
 * A base object for ECMAScript 5 style prototypal inheritance.
 *
 * @see https://github.com/rauschma/proto-js/
 * @see http://ejohn.org/blog/simple-javascript-inheritance/
 * @see http://uxebu.com/blog/2011/02/23/object-based-inheritance-for-ecmascript-5/
 */
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory();
	} else {
		root.Proto = factory();
	}
}(this, function () {

	function makeSuper(_super, old, name, fn) {
		return function () {
			var tmp = this._super;

			// Add a new ._super() method that is the same method
			// but either pointing to the prototype method
			// or to the overwritten method
			this._super = (typeof old === 'function') ? old : _super[name];

			// The method only need to be bound temporarily, so we
			// remove it when we're done executing
			var ret = fn.apply(this, arguments);
			this._super = tmp;

			return ret;
		};
	}

	function legacyMixin(prop, obj) {
		var self = obj || this;
		var fnTest = /\b_super\b/;
		var _super = Object.getPrototypeOf(self) || self.prototype;
		var _old;

		// Copy the properties over
		for (var name in prop) {
			// store the old function which would be overwritten
			_old = self[name];

			// Check if we're overwriting an existing function
			if(
					((
						typeof prop[name] === 'function' &&
						typeof _super[name] === 'function'
					) || (
						typeof _old === 'function' &&
						typeof prop[name] === 'function'
					)) && fnTest.test(prop[name])
			) {
				self[name] = makeSuper(_super, _old, name, prop[name]);
			} else {
				self[name] = prop[name];
			}
		}

		return self;
	}

	function es5Mixin(prop, obj) {
		var self = obj || this;
		var fnTest = /\b_super\b/;
		var _super = Object.getPrototypeOf(self) || self.prototype;
		var descriptors = {};
		var proto = prop;
		var processProperty = function(name) {
			if(!descriptors[name]) {
				descriptors[name] = Object.getOwnPropertyDescriptor(proto, name);
			}
		};

		// Collect all property descriptors
		do {
			Object.getOwnPropertyNames(proto).forEach(processProperty);
    } while((proto = Object.getPrototypeOf(proto)) && Object.getPrototypeOf(proto));
		
		Object.keys(descriptors).forEach(function(name) {
			var descriptor = descriptors[name];

			if(typeof descriptor.value === 'function' && fnTest.test(descriptor.value)) {
				descriptor.value = makeSuper(_super, self[name], name, descriptor.value);
			}

			Object.defineProperty(self, name, descriptor);
		});

		return self;
	}

	return {
		/**
		 * Create a new object using Object.create. The arguments will be
		 * passed to the new instances init method or to a method name set in
		 * __init.
		 */
		create: function () {
			var instance = Object.create(this);
			var init = typeof instance.__init === 'string' ? instance.__init : 'init';

			if (typeof instance[init] === 'function') {
				instance[init].apply(instance, arguments);
			}
			return instance;
		},
		/**
		 * Mixin a given set of properties
		 * @param prop The properties to mix in
		 * @param obj [optional] The object to add the mixin
		 */
		mixin: typeof Object.defineProperty === 'function' ? es5Mixin : legacyMixin,
		/**
		 * Extend the current or a given object with the given property
		 * and return the extended object.
		 * @param prop The properties to extend with
		 * @param obj [optional] The object to extend from
		 * @returns The extended object
		 */
		extend: function (prop, obj) {
			return this.mixin(prop, Object.create(obj || this));
		},
		/**
		 * Return a callback function with this set to the current or a given context object.
		 * @param name Name of the method to proxy
		 * @param args... [optional] Arguments to use for partial application
		 */
		proxy: function (name) {
			var fn = this[name];
			var args = Array.prototype.slice.call(arguments, 1);

			args.unshift(this);
			return fn.bind.apply(fn, args);
		}
	};

}));

},{}],47:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _client = require('feathers/client');

var _client2 = _interopRequireDefault(_client);

var _client3 = require('feathers-socketio/client');

var _client4 = _interopRequireDefault(_client3);

var _client5 = require('feathers-primus/client');

var _client6 = _interopRequireDefault(_client5);

var _client7 = require('feathers-rest/client');

var _client8 = _interopRequireDefault(_client7);

var _feathersHooks = require('feathers-hooks');

var _feathersHooks2 = _interopRequireDefault(_feathersHooks);

var _client9 = require('feathers-authentication/client');

var _client10 = _interopRequireDefault(_client9);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Object.assign(_client2.default, { socketio: _client4.default, primus: _client6.default, rest: _client8.default, hooks: _feathersHooks2.default, authentication: _client10.default });

exports.default = _client2.default;
module.exports = exports['default'];

},{"feathers-authentication/client":1,"feathers-hooks":14,"feathers-primus/client":15,"feathers-rest/client":17,"feathers-socketio/client":31,"feathers/client":33}]},{},[47])(47)
});
