'use strict';



/**
 * Retrive list of users
 */  
exports.getList = function (req, res) {
	req.ensureAdmin(req, res, function() {
	
		var workflow = req.app.utility.workflow(req, res);
		
		var query = function(next) {
			
			var find = req.app.db.models.User.find();
			
			if (req.param('name'))
			{
				find.or([
					{ firstname: new RegExp('^'+req.param('name'), 'i') },
					{ lastname: new RegExp('^'+req.param('name'), 'i') }
				]);

			}
			
			if (req.param('department'))
			{
				find.where('department').equals(req.param('department'));

			}
			
			if (req.param('collection'))
			{
				var collFind = req.app.db.models.AccountCollection.find();
				collFind.where('rightCollection').equals(req.param('collection'));
				collFind.select('account');
				
				collFind.exec(function (err, docs) {
					if (workflow.handleMongoError(err))
					{
						var accountIdList = [];
						for(var i=0; i<docs.length; i++) {
							accountIdList.push(docs[i]._id);
						}
						
						find.where('roles.account').in(accountIdList);
						next(find);
					}
				});

			} else {
				next(find);
			}
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
					
					var q = find.select('lastname firstname email roles isActive').sort('lastname');
				
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
		
		req.app.db.models.User
		.findOne({ '_id' : req.params.id}, 'lastname firstname email isActive department roles')
		.populate('roles.account')
		.populate('roles.admin')
		.populate('roles.manager')
		.exec(function(err, user) {
			if (workflow.handleMongoError(err))
			{
				res.json(user);
			}
		});
	
	});
};


exports.save = function (req, res) {
	req.ensureAdmin(req, res, function() {
		var gt = req.app.utility.gettext;
		var workflow = req.app.utility.workflow(req, res);
		var User = req.app.db.models.User;
		
		var userDocument = null;
		
		workflow.on('validate', function() {

			if (workflow.needRequiredFields(['firstname', 'lastname',  'email'])) {
			  return workflow.emit('response');
			}

			workflow.emit('save');
		});
		
		
		/**
		 * Update/create the user document
		 */  
		workflow.on('save', function() {

			if (req.params.id)
			{
				workflow.outcome.document = req.params.id;
				
				User.findById(req.params.id, function (err, user) {
					if (workflow.handleMongoError(err))
					{
						user.firstname 	= req.body.firstname;
						user.lastname 	= req.body.lastname;
						user.email 		= req.body.email;
						user.department = req.body.department;
                        user.isActive   = req.body.isActive;
						
						user.save(function (err) {
							workflow.handleMongoError(err);
							
							workflow.outcome.alert.push({
								type: 'success',
								message: gt.gettext('The user has been modified')
							});
							
							userDocument = user;
							
							workflow.emit('saveRoles');
						});
					}
				});
				
			} else {
				
				User.create({
					firstname: req.body.firstname,
					lastname: req.body.lastname,
					email: req.body.email,
					department: req.body.department 
				}, function(err, user) {
					
					if (workflow.handleMongoError(err))
					{
						workflow.outcome.document = user._id;
						userDocument = user;
						
						workflow.outcome.alert.push({
							type: 'success',
							message: gt.gettext('The user has been created')
						});

						workflow.emit('saveRoles');
					}
				});
			}
		});
		
		
		
		workflow.on('saveRoles', function() {
			
			if (!workflow.outcome.document)
			{
				return workflow.emit('exception', 'No user document to save roles on');
			}
            
            var saveRoles = require('../../modules/roles');
            
            saveRoles(
                req.app.db.models, 
                userDocument, 
                req.body.isAccount, 
                req.body.isAdmin, 
                req.body.isManager, 
                function updateUserWithSavedRoles(err, results) {

                    if (workflow.handleMongoError(err)) { // error forwarded by async
                        
                        userDocument.save(function(err) {
                            if (workflow.handleMongoError(err)) { // error for userDocument
                                workflow.emit('response');
                            }
                        });
                    }
				}
            );
		});
		
		
		
		workflow.emit('validate');
	});
};
