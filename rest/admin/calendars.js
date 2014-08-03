'use strict';


/**
 * Retrive list of calendars
 */  
exports.getList = function (req, res) {
	
	req.ensureAdmin(req, res, function(req, res) {
		var query = function() {
			var find = req.app.db.models.Calendar.find();
			if (req.param('name'))
			{
				find.where({ name: new RegExp(req.param('name'), 'i') });
			}
			
			if (req.param('type'))
			{
				find.where({ type: req.param('type') });
			}
			
			return find;
		};
		
		var workflow = req.app.utility.workflow(req, res);
		var paginate = require('node-paginate-anything');

		query().count(function(err, total) {
			
			var p = paginate(req, res, total, 50);
			
			if (!p) {
				res.json([]);
				return;
			}
			
			query()
			.select('name type lastUpdate')
			.sort('name')
			.limit(p.limit)
			.skip(p.skip)
			.exec(function (err, docs) {
				if (workflow.handleMongoError(err))
				{
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
		var CalendarModel = req.app.db.models.Calendar;
		
		workflow.on('validate', function() {

			if (workflow.needRequiredFields(['name', 'url'])) {
			  return workflow.emit('response');
			}

			workflow.emit('save');
		});
		
		workflow.on('save', function() {

			var fieldsToSet = { 
				name: req.body.name, 
				url: req.body.url,
				type: req.body.type,
				lastUpdate: new Date()  
			};

			if (req.params.id)
			{
				CalendarModel.findByIdAndUpdate(req.params.id, fieldsToSet, function(err, calendar) {
					if (workflow.handleMongoError(err))
					{
						calendar.downloadEvents();
						
						workflow.outcome.alert.push({
							type: 'success',
							message: gt.gettext('The calendar has been modified')
						});
						
						workflow.emit('response');
					}
				});
			} else {
				CalendarModel.create(fieldsToSet, function(err, calendar) {
					if (workflow.handleMongoError(err))
					{
						workflow.outcome.alert.push({
							type: 'success',
							message: gt.gettext('The calendar has been created')
						});
						
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
		
		req.app.db.models.Calendar.findOne({ '_id' : req.params.id}, 'name url type', function(err, calendar) {
			if (workflow.handleMongoError(err))
			{
				res.json(calendar);
			}
		});
	});
};	


