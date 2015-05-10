

/**
 * Source URL for non-working day ICS file or workshedules ICS file
 * 
 * The events in CalendarEvent schema will be delete and recreated according to the ics source file
 * the past events will never be modified
 * 
 * @see http://www.calconnect.org/tests/iCalendar-RRULE-Interop/iCalendar-RRULE-Interop-Matrix.html
 */  
exports = module.exports = function(params) {

    'use strict';
	
	var mongoose = params.mongoose;

    var defaultHalfDay = new Date();
    defaultHalfDay.setHours(12,0,0);
	
	var calendarSchema = new params.mongoose.Schema({
		name: { type: String, required: true },
		url: { type: String, required: true },
		type: { type: String, required: true },
		lastUpdate: { type: Date }, // date for last modification or last copy of events from ics to database
		timeCreated: { type: Date, default: Date.now },
		
		// used for the default ics embeded in the app
		locked: { type: Boolean, default: false },

        halfDayHour: { type: Date, default: defaultHalfDay },
		
		userCreated: {
			id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			name: { type: String, default: '' }
		}
	});

	calendarSchema.index({ 'lastUpdate': 1 });
	calendarSchema.set('autoIndex', params.autoIndex);
	
	
	calendarSchema.path('type').validate(function (value) {
		return /workschedule|nonworkingday|holiday/.test(value);
	}, 'Invalid type');
  
  
	/**
	 * Download events from url
     * promise resolve the number of copied events
     *
     * @return promise
	 */ 
	calendarSchema.methods.downloadEvents = function() {

        var Q = require('q');
		var ical = require('ical');
		var calendar = this;
        
        var deferred = Q.defer();


        function processEventsData(err, data) {


			
			if (err) {
                return deferred.reject(err.message);
			}

			var EventModel = params.db.models.CalendarEvent;
			
			EventModel.remove({ calendar: calendar._id }, function(err) {
				
				if (err)
				{
					return deferred.reject(err);
				}

				var entry = null;
                var eventPromises = [];
				
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

							eventPromises.push(event.save());
						}
					}
				}
			
                Q.allSettled(eventPromises)
                .then(function(results) {
                    
                    for(var i=0; i<results.length; i++) {
                        if (results[i].state !== "fulfilled") {
                            return deferred.reject(results[i].reason);
                        }
                    }

                    deferred.resolve(results.length);
                });
			});
		}

		if (0 === this.url.indexOf('http://')) {
            ical.fromURL(this.url, {}, processEventsData);
        } else {
            // relative address, use the local file instead because the http server is not allways present
            // ex: on database creation
            var data = ical.parseFile('public/'+this.url);
            processEventsData(null, data);
        }
        
        return deferred.promise;
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
    
    
    
    
    
    /**
     * initialize default calendars
     */  
    calendarSchema.statics.createFrenchDefaults = function(done) {

		var model = this;
        var async = require('async');

		async.each([
            {
                name: 'French non working days',
                url: 'http://www.google.com/calendar/ical/fr.french%23holiday%40group.v.calendar.google.com/public/basic.ics',
                type: 'nonworkingday'
            },
            {
                name: '35H full time work schedule',
                url: 'calendars/01.ics',
                type: 'workschedule',
                locked: true
            }
        ], function( type, callback) {
            
          model.create(type, function(err, calendar) {
              if (err) {
                  callback(err);
                  return;
              }

              calendar.downloadEvents().then(function() { 
                  callback();
              }, callback);
              
          });
        }, function(err){
            // if any of the file processing produced an error, err would equal that error
            if(err) {
                console.log(err);
                return;
            }
            
            if (done) {
                done();
            }
        });
    };
	
	
  
	params.db.model('Calendar', calendarSchema);
};




