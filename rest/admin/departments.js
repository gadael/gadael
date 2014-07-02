'use strict';

/**
 * Retrive list of departments
 */  
exports.getList = function (req, res) {
	
	if(!req.isAuthenticated()) {
		res.send(401); // not logged in
		return;
	}


	if (null === req.user.roles.admin)
	{
		res.send(401); // not admin
		return;
	}
	
	
	
	
	var query = function() {
		
		var find = req.app.db.models.Department.find();
		
		if (req.param('name'))
		{
			find.where({ name: new RegExp('^'+req.param('name'), 'i') });
		}
		
		return find;
	};
	
	var paginate = require('../../modules/paginate');

	query().count(function(err, total) {
			
		var p = paginate(req, res, total, 50);
		
		if (!p) {
			res.json([]);
			return;
		}
		
		var q = query().select('name').sort('name');
		
		q.limit(p.limit);
		q.skip(p.skip);

		q.exec(function (err, docs) {
			if (err) {
				return console.error(err);
			}
			
			res.json(docs);
		});
	});

};
