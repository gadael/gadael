'use strict';



/**
 * Retrive list of account collections
 */  
exports.getList = function (req, res) {
	req.ensureAdmin(req, res, function() {
	
		var workflow = req.app.utility.workflow(req, res);
		
		var query = function(next) {
			
			var find = req.app.db.models.AccountCollection.find();
			if (req.param('account'))
			{
				find.where('account').equals(req.param('account'));
			}
			
			next(find);
		};
		
		var paginate = require('node-paginate-anything');

		query(function(find) {
			
			find.count(function(err, total) {

				var p = paginate(req, res, total, 50);
				
				if (!p) {
					res.json({});
					return; // 416
				}
				
				query(function(find) {
					
					var q = find.select('account rightCollection from to').sort('from');
				
					q.limit(p.limit);
					q.skip(p.skip);

					q.exec(function (err, docs) {
						if (workflow.handleMongoError(err))
						{
							res.json(docs);
						}
					});
					
				});
			});
			
		});
	});
};



exports.getItem = function (req, res) {
	req.ensureAdmin(req, res, function() {
		var workflow = req.app.utility.workflow(req, res);
		
		req.app.db.models.AccountCollection
		.findOne({ '_id' : req.params.id}, 'account rightCollection from to')
		.exec(function(err, accountCollection) {
			if (workflow.handleMongoError(err))
			{
				res.json(accountCollection);
			}
		});
	
	});
};


exports.save = function (req, res) {
	req.ensureAdmin(req, res, function() {
		var gt = req.app.utility.gettext;
		var workflow = req.app.utility.workflow(req, res);
		var AccountCollection = req.app.db.models.AccountCollection;
		
		workflow.on('validate', function() {

			if (workflow.needRequiredFields(['account', 'rightCollection', 'from'])) {
			  return workflow.emit('response');
			}

			workflow.emit('save');
		});
		
		
		/**
		 * Update/create the accountCollection document
		 */  
		workflow.on('save', function() {

			if (req.params.id) {
				workflow.outcome.document = req.params.id;
				
				AccountCollection.findById(req.params.id, function (err, document) {
					if (workflow.handleMongoError(err))
					{
						document.account 			= req.body.account;
						document.rightCollection 	= req.body.rightCollection;
						document.from 				= req.body.from;
						document.to 				= req.body.to;
						
						document.save(function (err) {
							if (workflow.handleMongoError(err)) {
							
								workflow.outcome.alert.push({
									type: 'success',
									message: gt.gettext('The account collection has been modified')
								});
								
								workflow.emit('response');
							}
						});
					}
				});
				
			} else {
				
				AccountCollection.create({
					account: req.body.account,
					rightCollection: req.body.rightCollection,
					from: req.body.from,
					to: req.body.to 
				}, function(err, document) {
					
					if (workflow.handleMongoError(err))
					{
						workflow.outcome.document = document._id;
						
						workflow.outcome.alert.push({
							type: 'success',
							message: gt.gettext('The account collection has been created')
						});

						workflow.emit('response');
					}
				});
			}
		});

		
		workflow.emit('validate');
	});
};
