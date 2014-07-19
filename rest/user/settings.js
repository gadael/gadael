'use strict';



exports.save = function(req, res) {
	req.ensureUser(req, res, function() {
		var gt = req.app.utility.gettext;
		var workflow = req.app.utility.workflow(req, res);
		var user = req.app.db.models.User;
		
		workflow.on('validate', function() {

			if (workflow.needRequiredFields(['lastname', 'firstname', 'email'])) {
			  return workflow.emit('response');
			}

			workflow.emit('save');
		});
		
		workflow.on('save', function() {

			var fieldsToSet = { 
				firstname: req.body.firstname,
				lastname: req.body.lastname,
				email: req.body.email
			};

			
			user.findByIdAndUpdate(req.params.id, fieldsToSet, function(err, collection) {
				if (err) {
					return workflow.emit('exception', err.err);
				}
				
				workflow.outcome.alert.push({
					type: 'success',
					message: gt.gettext('Your settings has been modified')
				});
				
				workflow.emit('response');
			});
		});
		
		workflow.emit('validate');
	});
};


exports.getItem = function(req, res) {
	req.ensureUser(req, res, function() {
		
		var workflow = req.app.utility.workflow(req, res);
		
		req.app.db.models.User.findOne({ '_id' : req.params.id}, 'firstname lastname email', function(err, user) {
			if (err)
			{
				return workflow.emit('exception', err.message);
			}
			
			res.json(user);
		});
	});
};	


