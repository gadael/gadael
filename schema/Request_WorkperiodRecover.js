'use strict';

exports = module.exports = function(params) {
	var mongoose = params.mongoose;
	var wprSchema = new mongoose.Schema({
		event: { type: mongoose.Schema.Types.ObjectId, ref: 'CalendarEvent', required: true  },
		timeCreated: { type: Date, default: Date.now }
	});
  
	wprSchema.set('autoIndex', params.autoIndex);
  
	params.db.model('WorkperiodRecover', wprSchema);
};

