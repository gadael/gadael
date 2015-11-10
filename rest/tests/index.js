'use strict';


exports.populate = function(req, res) {
	
	// create some users

	var u = [];
	var createRandom = function(err) {
		if (err)
		{
			console.trace(err);
		}
	};
	
	for(var i=0;  i<20; i++)
	{
		req.app.db.models.User.createRandom('secret', createRandom);
	}

	
	res.json(u);
};

