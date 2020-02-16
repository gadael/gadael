'use strict';

const rruleAlt = require('rrule-alt');

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
		dtstart: { type: Date, required: true, index: true },
		dtend: { type: Date },
		summary: String,
		description: String,
		rrule: String,
        rdate: [Date],
		transp: String,
        status: { type: String, enum:['TENTATIVE', 'CONFIRMED', 'CANCELLED', 'PRECANCEL'], default: 'CONFIRMED', index:true },
			// TENTATIVE: Waiting for approval
			// CONFIRMED: Approval accepted
			// CANCELLED: Leave cancelled after approval
			// PRECANCEL: Non-standard; waiting for approval of a delete

		calendar: { type: mongoose.Schema.Types.ObjectId, ref: 'Calendar', index: true },
		user: { // for events linked requests there is no link to calendar but a link to user, owner of event
			id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
			name: { type: String, default: '' }
		},
        absenceElem: { type: mongoose.Schema.Types.ObjectId, ref: 'AbsenceElem', index: true }, // for absence
        request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', index: true }, // for absence or workperiod_recover
        overtime: { type: mongoose.Schema.Types.ObjectId, ref: 'Overtime', index: true }, // for workperiod_recover after approval or overtime without request
		timeCreated: { type: Date, default: Date.now },
        lunch: Boolean // count lunch only if true, info from right spec
	});




    /**
     * Pre save hook
     */
    eventSchema.pre('save', function(next) {
        this.wasNew = this.isNew;
        next();
    });


    /**
     * Post save hook
     */
    eventSchema.post('save', function(event) {

        if (event.wasNew) {
            event.googleCreate();
            return;
        }

        event.googleUpdate()
        .catch(err => {
            if (err.code === 404) {
                return event.googleCreate();
            }

            console.trace(err);
            console.log(event.googleGetObject());
        });
    });

     /**
     * Post remove hook
     */
    eventSchema.post('remove', function(event) {
        event.googleRemove();
    });



    /**
     * get User promise
     * resolve to user object
     * @return {Promise}
     */
    eventSchema.methods.getUser = function() {
        let event = this;

        if (!event.user.id) {
            return Promise.reject(new Error('This is not a personal event'));
        }

        return event.populate('user.id')
		.execPopulate()
		.then(populatedEvent => {
            return populatedEvent.user.id;
        });
    };


    eventSchema.methods.googleGetObject = function() {

        return {
            id: this.id,
            summary: this.summary,
            start: {
                dateTime: this.dtstart.toISOString()
            },
            end: {
                dateTime: this.dtend.toISOString()
            },
            status: this.status.toLowerCase(),
            description: this.description
        };

    };


    /**
     * Create in google calendar
     * @return {Promise}
     */
    eventSchema.methods.googleCreate = function() {

        let event = this;

        return event.getUser()
        .then(user => {

            if (!user.google || !user.google.calendar) {
                return false;
            }

            return user.callGoogleCalendarApi((googleCalendar, callback) => {
                googleCalendar.events.insert(user.google.calendar, event.googleGetObject(), callback);
            });
        })
		.catch(() => {
			// this is not a personal event
			return false;
		});
    };



    /**
     * Update in google calendar
     * @return {Promise}
     */
    eventSchema.methods.googleUpdate = function() {

        let event = this;

        return event.getUser()
        .then(user => {

            if (!user.google || !user.google.calendar) {
                return false;
            }

            return user.callGoogleCalendarApi((googleCalendar, callback) => {
                googleCalendar.events.update(user.google.calendar, event.id, event.googleGetObject(), callback);
            });
        })
		.catch(() => {
			// this is not a personal event
			return false;
		});
    };


    /**
     * Remove event in google calendar
     * @return {Promise}
     */
    eventSchema.methods.googleRemove = function() {

        let event = this;

        return event.getUser()
        .then(user => {

            if (!user.google || !user.google.calendar) {
                return false;
            }

            return user.callGoogleCalendarApi((googleCalendar, callback) => {
                googleCalendar.events.delete(user.google.calendar, event.id, callback);
            });
        });
    };



	/**
	 * Get duration in miliseconds
	 * @return int
	 */
	eventSchema.methods.getDuration = function() {

        if (undefined === this.dtend) {
            return 0;
        }

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
     * Get RRuleSet object if possible
     * @returns {RRuleSet}
     */
    eventSchema.methods.getRruleSet = function() {

        let document = this;

        let RRule = rruleAlt.RRule;
        let RRuleSet = rruleAlt.RRuleSet;


        let rruleSet = new RRuleSet();

        let setRRULE = false;
        let setRDATE = false;


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
            return null;
        }

        return rruleSet;
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

		let document = this;


		let duration = document.getDuration();
        let rruleSet = document.getRruleSet();

        if (null === rruleSet) {
            return [document.toObject()];
        }

		// the between method will not get events where start date is before (overlapping events)

		let searchStart = new Date(span_start);
		searchStart.setHours(0,0,0,0);

		let list = rruleSet.between(searchStart, span_end, true);
        let result = [];

		for (let i=0; i<list.length; i++) {

			var event = document.toObject();
			event.dtstart = list[i];
			event.dtend = new Date(list[i].getTime() + duration);

			if (event.dtend <= span_start) {
				continue;
			}

			result.push(event);
		}

        return result;
	};


	eventSchema.set('autoIndex', params.autoIndex);

	params.db.model('CalendarEvent', eventSchema);
};
