'use strict';

/**
 * Retrive session information for all page
 * language
 * user access rights
 * who is logged
 * etc...
 */  
exports.getInfos = function(req, res) {
	
  // detect language from HTTP-ACCEPT
  
	var lang = require('../node_modules/i18n-abide/lib/i18n').parseAcceptLanguage(req.headers['accept-language']);
  

	res.json({ 
		lang: lang[0].lang,
		user: {
			isAuthenticated: req.isAuthenticated(),
			lastname: req.user.lastname,
			firstname: req.user.firstname 
		}
	});
};



exports.http404 = function(req, res) {
	res.json({ http: 404 });
}
