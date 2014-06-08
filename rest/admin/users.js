'use strict';

/**
 * Retrive list of users
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
	

	
	req.app.db.models.User.count(function(err, total) {
		var query = req.app.db.models.User.find()
			.select('username email firstname lastname')
			.skip((req.param('page') -1) * req.param('count'))
			.limit(req.param('count'))
			.sort(req.param('sorting'));

		query.exec(function (err, docs) {
			if (err) {
				return console.error(err);
			}
			res.json({
				result:docs, 
				total:total
			});
		});
		
	});


	
};





/**
 * Retrive list of users
 */  
exports.getPage = function (req, res) {
	
	if(!req.isAuthenticated()) {
		res.send(401); // not logged in
		return;
	}


	if (null === req.user.roles.admin)
	{
		res.send(401); // not admin
		return;
	}
	
	var paginate = require('../../modules/paginate');
	
	req.app.db.models.User.count(function(err, total) {
		var query = req.app.db.models.User.find()
			.select('lastname firstname email')
			.sort('lastname');
			
		var p = paginate(req, res, total, 50);
		
		if (!p) {
			res.json({});
			return; // 416
		}
		
		query.limit(p.limit);
		query.skip(p.skip);

		query.exec(function (err, docs) {
			if (err) {
				return console.error(err);
			}
			
			res.json(docs);
		});
	});


	
};
