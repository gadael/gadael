'use strict';


exports.populate = function(req, res) {
	
	// create some users
	
	var Charlatan = require('../../node_modules/charlatan/lib/charlatan.js');
	
	var u = [];
	for(var i=0;  i<20; i++)
	{
		req.app.db.models.User.createRandom('secret', function(err) {
			if (err)
			{
				console.log(err);
			}
		});
		
	}

	
	res.json(u);
};

