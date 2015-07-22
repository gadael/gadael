/**
 * a gettext instance
 * @todo set user language
 */  

var Gettext = require("node-gettext");
	
exports = module.exports = new Gettext();

exports.addTextdomain("fr", require("fs").readFileSync("./po/server/fr.mo"));
exports.textdomain("fr");
