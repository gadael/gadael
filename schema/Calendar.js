'use strict';

/**
 * Source URL for non-working day ICS file or workshedules ICS file
 * 
 * The events in CalendarEvent schema will be delete and recreated according to the ics source file
 * the past events will never be modified
 * 
 * @see http://www.calconnect.org/tests/iCalendar-RRULE-Interop/iCalendar-RRULE-Interop-Matrix.html
 */  
exports = module.exports = function(params) {
	
	var mongoose = params.mongoose;
	
	var calendarSchema = new params.mongoose.Schema({
		name: { type: String, required: true },
		url: { type: String, required: true },
		type: { type: String, required: true },
		lastUpdate: { type: Date }, // date for last modification or last copy of events from ics to database
		timeCreated: { type: Date, default: Date.now },
		
		// used for the default ics embeded in the app
		locked: { type: Boolean, default: false },
		
		userCreated: {
			id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			name: { type: String, default: '' }
		}
	});

	calendarSchema.index({ 'lastUpdate': 1 });
	calendarSchema.set('autoIndex', params.autoIndex);
	
	
	calendarSchema.path('type').validate(function (value) {
		return /workschedule|nonworkingday/.test(value);
	}, 'Invalid type');
  
  
	/**
	 *  Download events from url
	 */ 
	calendarSchema.methods.downloadEvents = function() {
		var ical = require('ical');
		var calendar = this;
		
		console.log('Download '+calendar.url);
		
		ical.fromURL(this.url, {}, function(err, data) {
			
			if (err)
			{
				console.log(err);
				return;
			}
			
			var EventModel = params.db.models.CalendarEvent;
			
			EventModel.remove({ calendar: calendar._id }, function(err) {
				
				if (err)
				{
					console.log(err);
					return;
				}
			
				var entry = null;
				
				var saved = function (err) {
					if (err) {
						console.log(err);
					}
				};
				
				for (var k in data){
					if (data.hasOwnProperty(k)) {
						
						entry = data[k];
						
						if (entry.type === 'VEVENT') {
							var event = new EventModel();
							event.uid = entry.uid;
							event.dtstart = entry.start;
							event.dtend = entry.end;
							event.summary = entry.summary;
							event.description = entry.description;
							event.transp = entry.transparency;
							if (entry.rrule)
							{
								event.rrule = entry.rrule.toString();
							}
							event.calendar = calendar._id;
							
							event.save(saved);
						}
					}
				}
			
			});
		});
	};
	
	
	
	/**
	 * get events from database beeween two dates
	 * RRULE events are expanded from this mehod
	 *
	 */ 
	calendarSchema.methods.getEvents = function(span_start, span_end, callback) {
		
		var EventModel = params.db.models.CalendarEvent;
		var async = require('async');
		
		EventModel.find({ 
			$or:[ 
				{'rrule': { $ne: null } }, 
				{ 
					$and: [
						{ 'dtstart': { $lt: span_end }},
						{ 'dtend': { $gt: span_start }}
					]
				} 
			]
		})
		.sort('dtstart')
		.exec(function(err, documents) {
			if (err) {
				callback(err, null);
				return;
			}
			
			var events = [];
			
			async.eachSeries(documents, function(document, async_expanded) {
				document.expand(span_start, span_end, function(epanded_event) {
					events.push(epanded_event);
					async_expanded();
				});
				
			}, function(err){
				if (!err)
				{
					callback(events);
				}
			});
		});
	};
	
	
  
	params.db.model('Calendar', calendarSchema);
};




