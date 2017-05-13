/**
 * Module dependencies.
 */
var format = require('util').format;
var isArray = require('util').isArray;


/**
 * Expose `flash()` function on requests.
 *
 * @return {Function}
 * @api public
 */
module.exports = function flash(options) {
  options = options || {};
  var safe = (options.unsafe === undefined) ? true : !options.unsafe;

  return function(req, res, next) {
    if (req.flash && safe) { return next(); }
    req.flash = _flash;
    next();
  }
}

/**
 * Queue flash `msg` of the given `type`.
 *
 * Examples:
 *
 *      req.flash('info', 'email sent');
 *      req.flash('error', 'email delivery failed');
 *      req.flash('info', 'email re-sent');
 *      // => 2
 *
 *      req.flash('info');
 *      // => ['email sent', 'email re-sent']
 *
 *      req.flash('info');
 *      // => []
 *
 *      req.flash();
 *      // => { error: ['email delivery failed'], info: [] }
 *
 * Formatting:
 *
 * Flash notifications also support arbitrary formatting support.
 * For example you may pass variable arguments to `req.flash()`
 * and use the %s specifier to be replaced by the associated argument:
 *
 *     req.flash('info', 'email has been sent to %s.', userName);
 *
 * Formatting uses `util.format()`.
 *
 * @param {String} type
 * @param {String} msg
 * @return {Array|Object|Number}
 * @api public
 */
function _flash(type, msg) {
  if (this.session === undefined) throw Error('req.flash() requires sessions');
  var msgs = this.session.flash || {};
  if (type && msg) {
    msgs[type] = msgs[type] || []
    if (arguments.length > 2) {
      var args = Array.prototype.slice.call(arguments, 1);
      msg = format.apply(undefined, args);
    } else if (isArray(msg)) {
      msg.forEach(function(val){
        msgs[type].push(val);
      });
      this.session.flash = msgs;
      return msgs[type].length;
    }
    var ret = msgs[type].push(msg);
    this.session.flash = msgs;
    return ret;
  } else if (type) {
    var arr = msgs[type];
    if (isArray(arr)) delete msgs[type];
    if (Object.keys(msgs).length === 0) {
      delete this.session.flash;
    } else {
      this.session.flash = msgs;
    }
    return arr || [];
  } else {
    return msgs;
  }
}
