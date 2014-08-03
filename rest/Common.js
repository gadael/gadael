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
	
	var user = null;
  
	if (req.isAuthenticated())
	{
		user = {
			isAuthenticated: req.isAuthenticated(),
			lastname: req.user.lastname,
			firstname: req.user.firstname,
			email: req.user.email
		};
		
	} else {
		user = { 
			isAuthenticated: false 
		};
	}

	res.json({ 
		lang: lang[0].lang,
		user: user,
		date: {
			short: 'dd-MM-yyyy',
			long: 'EEEE d MMMM yyyy',
			shortTime: 'dd-MM-yyyy HH:mm Z',
			longTime: 'EEEE d MMMM yyyy HH:mm Z'
		}
	});
};



exports.http404 = function(req, res) {
	res.json({ http: 404 });
};
