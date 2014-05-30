'use strict';

/**
 * Retrive session information for all page
 * language
 * user access rights
 * who is logged
 * etc...
 */  
exports.getInfos = function (req, res) {
	
	// require an admin account to display admin menu entries

	if(!req.isAuthenticated()) {
		res.send(401); // not logged in
		return;
	}

	// TODO test access rights


	res.json({
		menu: [
			{url: 'admin/users', name:'Users'},
			{url: 'admin/groups', name:'Groups'}
		]
	});
};
