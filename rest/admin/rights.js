'use strict';

/**
 * Retrive list of rights
 */  
exports.getList = function (req, res) {
	
	req.ensureAdmin(req, res, function(req, res) {
        
        var workflow = req.app.utility.workflow(req, res);
		
		var query = function() {
			var find = req.app.db.models.Right.find();
			if (req.param('name'))
			{
				find.where({ name: new RegExp('^'+req.param('name'), 'i') });
			}
			return find;
		};
		
		var paginate = require('node-paginate-anything');

		query().count(function(err, total) {
			var p = paginate(req, res, total, 50);
			
			if (!p) {
				res.json([]);
				return;
			}
			
			query()
			.select('name description type quantity quantity_unit')
			.sort('sortkey')
			.limit(p.limit)
			.skip(p.skip)
			.exec(function (err, docs) {
				if (workflow.handleMongoError(err)) {
                    res.json(docs);
                }
			});
		});
	});
};




exports.save = function(req, res) {
	req.ensureAdmin(req, res, function() {
		var gt = req.app.utility.gettext;
		var workflow = req.app.utility.workflow(req, res);
		var Right = req.app.db.models.Right;
		
		workflow.on('validate', function() {

			if (workflow.needRequiredFields(['name'])) {
			  return workflow.emit('response');
			}

			workflow.emit('save');
		});
		
		workflow.on('save', function() {

			var fieldsToSet = { 
				name: req.body.name
			};

			if (req.params.id)
			{
				Right.findByIdAndUpdate(req.params.id, fieldsToSet, function(err, right) {
					if (workflow.handleMongoError(err)) {
                        workflow.outcome.alert.push({
                            type: 'success',
                            message: gt.gettext('The right type has been modified')
                        });
                        
                        workflow.document = right;
                        workflow.emit('response');
                    }
				});
			} else {
				Right.create(fieldsToSet, function(err, right) {
					if (workflow.handleMongoError(err)) {
                        workflow.outcome.alert.push({
                            type: 'success',
                            message: gt.gettext('The right type has been created')
                        });
                        
                        workflow.document = right;
                        workflow.emit('response');
                    }
				});
			}
			
			
		});
		
		workflow.emit('validate');
	});
};


exports.getItem = function(req, res) {
	req.ensureAdmin(req, res, function() {
		// var gt = req.app.utility.gettext;
		var workflow = req.app.utility.workflow(req, res);
		
		req.app.db.models.Right.findOne({ '_id' : req.params.id}, 'name description type require_approval autoDistribution quantity quantity_unit activeFor activeSpan', function(err, type) {
			if (workflow.handleMongoError(err)) {
                res.json(type);
            }
		});
	});
};	
