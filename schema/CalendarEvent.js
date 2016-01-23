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
		dtstart: { type: Date, required: true },
		dtend: { type: Date }, // , required: true
		summary: String,
		description: String,
		rrule: String,
        rdate: [Date],
		transp: String,
        status: { type: String, enum:['TENTATIVE', 'CONFIRMED', 'CANCELLED'], default: 'CONFIRMED' },
		
		calendar: { type: mongoose.Schema.Types.ObjectId, ref: 'Calendar' },
		user: { // for events linked requests there is no link to calendar but a link to user, owner of event
			id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			name: { type: String, default: '' }
		},
        absenceElem: { type: mongoose.Schema.Types.ObjectId, ref: 'AbsenceElem' }, // for absence
        request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' }, // for absence or workperiod_recover
		timeCreated: { type: Date, default: Date.now }
	});


	eventSchema.index({ 'uid': 1 });
	eventSchema.index({ 'dtstart': 1 });
	eventSchema.set('autoIndex', params.autoIndex);
	
	
	/**
	 * Get duration in miliseconds
	 * @return int
	 */ 
	eventSchema.methods.getDuration = function() {
		var start = this.dtstart.getTime();
		var end = this.dtend.getTime();
		
		return (end - start);
	};


    /**
	 * Get event UID
	 * @return string
	 */
	eventSchema.methods.getUid = function() {
		if (this.uid !== undefined) {
            return this.uid;
        }

        return this._id;
	};
	
	
	
	/**
	 * Expand event to a list of events according to the rrule (synchronous)
     *
	 * @param	{Date}		span_start		Search span start
	 * @param	{Date}		span_end		Search span end
	 *                                 
	 * @return {Array} an array of objects
	 */ 
	eventSchema.methods.expand = function(span_start, span_end) {
        
        if (!(span_start instanceof Date) || !(span_end instanceof Date)) {
            throw new Error('parameters must be dates');
        }
		
		var document = this;
		var RRule = require('rrule').RRule;
        var RRuleSet = require('rrule').RRuleSet;
		
		var duration = document.getDuration();
        var rruleSet = new RRuleSet();

        var setRRULE = false;
        var setRDATE = false;


        if (undefined !== document.rrule && null !== document.rrule) {

            var options = RRule.parseString(document.rrule);
            options.dtstart = document.dtstart;
            var rule = new RRule(options);

            rruleSet.rrule(rule);
            setRRULE = true;
        }


        if (undefined !== document.rdate && null !== document.rdate && document.rdate.length > 0) {
            // add rdate
            document.rdate.forEach(function(d) {
                if (d instanceof Date) {
                    rruleSet.rdate(d);
                }
            });
            setRDATE = true;
        }

        if (!setRRULE && !setRDATE) {
            return [document.toObject()];
        }


		
		var list = rruleSet.between(span_start, span_end, true);
        var result = [];
		
		for(var i=0; i<list.length; i++)
		{
			var event = document.toObject();
			event.dtstart = list[i];
			event.dtend = new Date(list[i].getTime() + duration);
			result.push(event);
		}
        
        return result;
	};
  
	params.db.model('CalendarEvent', eventSchema);
};
