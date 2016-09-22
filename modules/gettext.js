/**
 * a gettext instance
 * @todo set user language
 */

var Gettext = require("node-gettext");
var config = require('./../config')();

exports = module.exports = new Gettext();

exports.addTextdomain("fr", require("fs").readFileSync('./po/server/fr.mo'));
exports.addTextdomain("en", '');

exports.textdomain(config.language);
