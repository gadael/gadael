'use strict';

/**
 * periods to display on calendar or exported to icalendar format
 * 
 * can be associated to:
 * 	- vacation requests elements (quantity + right + absence request)
 *  - workschedules (external url provide source as ICS, stored here for cache)
 *  - non working days (external url provide source as ICS, stored here for cache)
 * 
 *  ics link to a calendar (workschedule or non working days)
 *  user.id link to to vacation entry owner
 */
exports = module.exports = function(params) {
	
	var mongoose = params.mongoose;
	
	var eventSchema = new mongoose.Schema({
		uid: { type: String, required: true },
		dtstart: { type: Date, required: true },
		dtend: { type: Date, required: true },
		summary: String,
		description: String,
		rrule: String,
		transp: String,
		
		calendar: { type: mongoose.Schema.Types.ObjectId, ref: 'Calendar' },
		user: {
			id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			name: { type: String, default: '' },
			absenceElem: { type: mongoose.Schema.Types.ObjectId, ref: 'AbsenceElem' }
		},
		timeCreated: { type: Date, default: Date.now }
	});

	eventSchema.index({ 'uid': 1 });
	eventSchema.index({ 'dtstart': 1 });
	eventSchema.set('autoIndex', params.autoIndex);
	
	
	/**
	 * Get duration in seconds
	 * @return int
	 */ 
	eventSchema.methods.duration = function() {
		var start = Math.round(this.dtstart.getTime() / 1000);
		var end = Math.round(this.dtend.getTime() / 1000);
		
		return (end - start);
	}
	
	
	
	/**
	 * Expand event to a list of events according to the rrule
	 * @param	Date		span_start		Search span start
	 * @param	Date		span_end		Search span end
	 * @param	function	callback 		for each event
	 */ 
	eventSchema.methods.expand = function(span_start, span_end, callback) {
		
		var document = this;
		var rrule = require('rrule').RRule;
		var extend = require('util')._extend;
		
		if (document.rrule == undefined || document.rrule == null)
		{
			callback(document);
			return;
		}
		
		var duration = document.duration();
		
		var options = rrule.parseString(document.rrule);
		options.dtstart = document.dtstart;
		var rule = new rrule(options);
		
		var list = rule.between(span_start, span_end, true);
		
		for(var i=0; i<list.length; i++)
		{
			var event = extend({}, document);
			event.dtstart = list[i];
			event.dtend = list[i];
			event.dtend.setSeconds(list[i].getSeconds() + duration);
			
			callback(event);
		}
	};
  
	params.db.model('CalendarEvent', eventSchema);
};
