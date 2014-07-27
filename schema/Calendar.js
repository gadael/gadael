'use strict';

/**
 * Source URL for non-working day ICS file or workshedules ICS file
 * 
 * The events in CalendarEvent schema will be delete and recreated according to the ics source file
 * the past events will never be modified
 */  
exports = module.exports = function(params) {
	
	var mongoose = params.mongoose;
	
	var icsSchema = new params.mongoose.Schema({
		name: { type: String, required: true },
		url: { type: String, required: true },
		type: { type: String, required: true },
		lastUpdate: { type: Date }, 
		timeCreated: { type: Date, default: Date.now },
		
		// used for the default ics embeded in the app
		locked: { type: Boolean, default: false },
		
		userCreated: {
			id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			name: { type: String, default: '' }
		}
	});

	icsSchema.index({ 'lastUpdate': 1 });
	icsSchema.set('autoIndex', params.autoIndex);
	
	
	icsSchema.path('type').validate(function (value) {
		return /workschedule|nonworkingday/.test(value);
	}, 'Invalid type');
  
	params.db.model('Calendar', icsSchema);
};

