'use strict';



/**
 * Retrive list of users
 */  
exports.getList = function (req, res) {
	req.ensureAdmin(req, res, function() {
	
		var query = function() {
			
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
			workflow.handleMongoError(err);
			res.json(user);
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
					workflow.handleMongoError(err);
				  
					user.firstname = req.body.firstname;
					user.lastname = req.body.lastname;
					user.email = req.body.email;
					
					user.save(function (err) {
						workflow.handleMongoError(err);
						
						workflow.outcome.alert.push({
							type: 'success',
							message: gt.gettext('The user has been modified')
						});
						
						userDocument = user;
						
						workflow.emit('saveRoles');
					});
				});
				
			} else {
				
				User.create({
					firstname: req.body.firstname,
					lastname: req.body.lastname,
					email: req.body.email,
				}, function(err, user) {
					
					workflow.handleMongoError(err);
					
					
					workflow.outcome.document = user._id;
					userDocument = user;
					
					workflow.outcome.alert.push({
						type: 'success',
						message: gt.gettext('The user has been created')
					});

					workflow.emit('saveRoles');
				});
			}
		});
		
		
		
		workflow.on('saveRoles', function() {
			
			if (!workflow.outcome.document)
			{
				return workflow.emit('exception', 'No user document to save roles on');
			}
			
			
			var removeOrUpdate = function(checkedRole, model, userReference, updateCallback, noRoleCallback) {
				

				var promise = model.find({ user: { id: workflow.outcome.document }}).exec();
				
				promise.then(function(roles) {
					
					if (0 === roles.length) {
						
						if (checkedRole) {
							var role = new model();
							role.user = {
								id: workflow.outcome.document,
								name: userDocument.lastname+' '+userDocument.firstname
							};
							userReference = role._id;
							
							updateCallback(role);
							return;
						}
						
					} else if (1 <= roles.length) {
						
						if (checkedRole) {
							updateCallback(roles[0]);
							return;
						} else {
							userReference = undefined;
							roles.forEach(function(role) { 
								role.remove();
								
							});
						}
					}
					
					noRoleCallback();
					
					
				}, function (err) {
					workflow.handleMongoError(err);
					noRoleCallback();
				});
		
			};
			
			
			require('async').parallel([
				function(asyncTaskEnd) {
					
					console.log('removeOrUpdate(isAccount');
					
					removeOrUpdate(req.body.isAccount, req.app.db.models.Account, userDocument.roles.account, function(role) {
						
						if (req.body.roles && req.body.roles.account) {
							role.accountCollection = req.body.roles.account.accountCollection;
						}
						
						role.save(
							function(err) {
								workflow.handleMongoError(err);
								asyncTaskEnd(null, 'account');
							}
						);
					}, function() {
						asyncTaskEnd(null, 'account');
					});
				},
				
				function(asyncTaskEnd) {
					removeOrUpdate(req.body.isAdmin, req.app.db.models.Admin, userDocument.roles.admin, function(role) {
						
						role.save(
							function(err) {
								workflow.handleMongoError(err);
								asyncTaskEnd(null, 'admin');
							}
						);
					}, function() {
						asyncTaskEnd(null, 'admin');
					});
				},
				
				function(asyncTaskEnd) {
					removeOrUpdate(req.body.isManager, req.app.db.models.Manager, userDocument.roles.manager, function(role) {
						
						role.save(
							function(err) {
								workflow.handleMongoError(err);
								asyncTaskEnd(null, 'manager');
							}
						);
					}, function() {
						asyncTaskEnd(null, 'manager');
					});
				}],
				
				function updateUserWithSavedRoles(err, results) {
					
					userDocument.save(function(err) {
						workflow.handleMongoError(err);
						workflow.emit('response');
					});
				}
			);
		});
		
		
		
		workflow.emit('validate');
	});
};
