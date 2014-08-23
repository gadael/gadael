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
        
        var util = require('util');
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
         * Get account ID from query
         */ 
        var getAccount = function(next) {
            
            if (req.body.account) {
                next(req.body.account);
                return;
            }
            
            if (!req.body.user) {
                workflow.emit('exception', 'Cant create accountCollection, missing user or account');
                return;
            }
            
            // find account from user
            req.app.db.models.User.findById(req.body.user, function(err, user) {
                if (workflow.handleMongoError(err)) {
                    
                    if (!user) {
                        workflow.emit('exception', 'User not found '+req.body.user);
                        return;
                    }
                    
                    if (!user.account) {
                        
                        // user without account
                        return;
                    }
                    
                    next(user.account);
                }
            });
        };
        
		
		
		/**
		 * Update/create the accountCollection document
		 */  
		workflow.on('save', function() {

			if (req.params.id) {
				
				
				AccountCollection.findById(req.params.id, function (err, document) {
					if (workflow.handleMongoError(err))
					{
                        if (null === document) {
                            workflow.emit('exception', util.format(gt.gettext('AccountCollection document not found for id %s'), req.params.id));
                            return;
                        }
                        
						document.rightCollection 	= req.body.rightCollection;
						document.from 				= req.body.from;
						document.to 				= req.body.to;
						
						document.save(function (err) {
							if (workflow.handleMongoError(err)) {
                                workflow.document = document;
								workflow.success(gt.gettext('The account collection has been modified'));
							}
						});
					}
				});
				
			} else {
                
                getAccount(function(accountId) {
				
                    AccountCollection.create({
                        account: accountId,
                        rightCollection: req.body.rightCollection,
                        from: req.body.from,
                        to: req.body.to 
                    }, function(err, document) {
                        
                        if (workflow.handleMongoError(err))
                        {
                            workflow.document = document;
                            workflow.success(gt.gettext('The account collection has been created'));
                        }
                    });
                
                });
			}
		});

		
		workflow.emit('validate');
	});
};


exports.remove = function (req, res) {
    req.ensureAdmin(req, res, function() {
        
		var gt = req.app.utility.gettext;
		var workflow = req.app.utility.workflow(req, res);
		var AccountCollection = req.app.db.models.AccountCollection;
        
        
        workflow.on('find', function() {
            
            AccountCollection.findById(req.params.id, function (err, document) {
                if (workflow.handleMongoError(err)) {
                    workflow.document = document;
                    workflow.emit('validate');
                }
            });
        });
        
		
		workflow.on('validate', function() {
            
            if (!workflow.document) {
                workflow.emit('exception', 'Document not found '+req.params.id);
                return;
            }
            
            if (workflow.document.from < new Date()) {
                workflow.emit('exception', gt.gettext('Delete a collection aulready started is not allowed'));
                return;
            }
			
			workflow.emit('delete');
		});
        
        
        workflow.on('delete', function() {
            workflow.document.remove();
            workflow.success(gt.gettext('The collection has been removed from account'));
        });
        
        workflow.emit('find');
    });
};
