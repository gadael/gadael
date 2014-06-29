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
	
	
	
	
	var query = function() {
		
		var find = req.app.db.models.User.find();
		
		if (req.param('name'))
		{
			find.or([
				{ firstname: new RegExp('^'+req.param('name'), 'i') },
				{ lastname: new RegExp('^'+req.param('name'), 'i') }
			]);

		}
		
		if (req.param('collection'))
		{
			find.where('roles.account.accountCollection').equals(req.param('collection'));

		}
		
		
		return find;
	};
	
	var paginate = require('../../modules/paginate');

	query().count(function(err, total) {
			
		var p = paginate(req, res, total, 50);
		
		if (!p) {
			res.json({});
			return; // 416
		}
		
		var q = query().select('lastname firstname email').sort('lastname');
		
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
