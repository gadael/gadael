'use strict';

const util = require('util');
const daysBetween = require('../modules/daysBetween');

/**
 *
 */
exports = module.exports = function(params) {
	var mongoose = params.mongoose;
	var absenceElemSchema = new mongoose.Schema({
        quantity: { type: Number, required: true },         // quantity equal to duration of period in the planning (only duration of worked schedule)
        consumedQuantity: { type: Number, required: true }, // quantity removed from vacation right according to Right.consumption
                                                            // consumption=proportion: attendance percentage from RightCollection
                                                            // consumption=businessDays: businessDays from RightCollection
        events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CalendarEvent' }],

		request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', index: true }, // required but is saved after element creation

        user: {                                     // absence owner
          id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
          name: { type: String, required: true }
        },

        right: {                                    // right parameters used on absence creation
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'Right', required: true },
            name: { type: String, required: true },
            quantity_unit: { type: String, enum:['D', 'H'], required: true },
            type: {
                id: { type: mongoose.Schema.Types.ObjectId, ref: 'Type', required: true },
                name: { type: String, required: true },
                color: { type: String }
            },
            renewal: {
                id: { type: mongoose.Schema.Types.ObjectId, ref: 'RightRenewal' , required: true },
                start: { type: Date, required: true },
                finish: { type: Date, required: true }
            },
            consumption: {                  // consumption type
                type: String,
                enum:[
					'proportion',			// proportion: use the attendance percentage defined in user right collection
					'businessDays',			// businessDays: next business days are consumed up to consumptionBusinessDaysLimit
					'workingDays',			// workingDays: full working days are consumed
					'duration',				// duration: equal duration (quantity field)
					'length'				// length: number of days between the two dates
				],
                required: true
            },

            consumptionBusinessDaysLimit: { type: Number, default: 5 }, // Used if consumption=businessDays
            lunch: Boolean
		}
	});


    /**
     * Pre-save hook
     *
     */
    absenceElemSchema.pre('validate', function(next) {

        let err;

        if (!this.events || this.events.length === 0) {
            err = new Error('Invalid event list on absence element');
            return next(err);
        }

        if (this.quantity <= 0) {
            err = new Error('Invalid duration quantity on absence element');
            return next(err);
        }

        if (this.consumedQuantity <= 0) {
            err = new Error('Invalid consumption on absence element, quantity='+this.quantity+' consumedQuantity='+this.consumedQuantity);
            return next(err);
        }

        next();
    });



    /**
     * Get an array with one date per leave day, incuding week-ends
     * @return {array}
     */
    absenceElemSchema.methods.getLeaveDays = function() {

        let dtstart = this.events[0].dtstart;
        let dtend = this.events[this.events.length-1].dtend;

        let days = [];

        let loop = new Date(dtstart);
        loop.setHours(0,0,0,0);

        while (loop < dtend) {
            days.push(new Date(loop));
            loop.setDate(loop.getDate() + 1);
        }

        return days;
	};


	/**
	 * Get request from absence element
	 * @return {Promise}
	 */
	absenceElemSchema.getRequest = function() {
		return this.events[0]
		.populate('request')
		.execPopulate()
		.then(event => {
			return event.request;
		});
	};


    /**
     * Get leave days until back to work, incuding week-end
     *
     * @param {Array}  appliquantWorkingDays List of working days of the request appliquant
     *
     * @returns {[[Type]]} [[Description]]
     */
    absenceElemSchema.methods.getLeaveDaysUntilBack = function(appliquantWorkingDays) {

        let days = this.getLeaveDays();

        let dtend = this.events[this.events.length-1].dtend;

        let loop = new Date(dtend);
        loop.setHours(0,0,0,0);

        let d;

        do {
            loop.setDate(loop.getDate()+1);
            d = loop.getDay();

        } while(-1 === appliquantWorkingDays.indexOf(d));

        return days;
    };



    /**
     * Get additional deducted quantity for part-time collections
     * this method get the number of days in base business days witch are not in applicant working days
     * this method is used for consumption method : businessDays or WorkingDays
     *
     * @param {Array}  baseAttendanceDays    List of business days or working days for a 100% attendance
     *
     * @param {Array}  appliquantWorkingDays    List of working days of the request appliquant
     *                                          full days based on the applicant working times calendar
     *
     * @return {Number} Number of days
     */
    absenceElemSchema.methods.getAdditionalDeductedQuantity = function(baseAttendanceDays, appliquantWorkingDays) {

        if ('D' !== this.right.quantity_unit) {
            throw new Error('This methods is not appropriate with this quantity unit');
        }

        let days = this.getLeaveDaysUntilBack(appliquantWorkingDays);
        let d, total = 0;

        for (var i=0; i<days.length; i++) {
            d = days[i].getDay();
            if (-1 !== baseAttendanceDays.indexOf(d)) { // ignore week-end
                if (-1 === appliquantWorkingDays.indexOf(d)) { // ignore days already in quantity
                    total += 1;
                }
            }
        }

        return total;
    };





    /**
     * get events promise
     * if already populated, promisify the existing array
     * else populate the document
     *
     * @return {Promise}
     */
    absenceElemSchema.methods.getEvents = function() {

        let elem = this;

        if (!elem.events) {
            Promise.reject(new Error('Missing events property'));
        }

        if (elem.populated('events')) {
            return Promise.resolve(elem.events);
        }

		return elem.populate('events')
		.execPopulate()
		.then(populatedElement => {
            return populatedElement.events;
        });
    };


	/**
	 * Get element dates boundaries
	 * @return {Promise}
	 */
	absenceElemSchema.methods.getBoundaries = function() {
		let elem = this;

		return elem.getEvents()
		.then(events => {
			return {
				dtstart: events[0].dtstart,
				dtend: events[events.length-1].dtend
			};
		});
	};


	/**
	 * Get length in days
	 * @return {Promise} resolve to a number
	 */
	absenceElemSchema.methods.getLength = function() {

		return this.getBoundaries()
		.then(boundaries => {
			return daysBetween(boundaries.dtstart, boundaries.dtend);
		});
	};




    /**
     * Get list of working days using the working times calendar associated to applicant in the absence element period
     * Return an array with dates where the applicant should work but is not, excepted from the last worked date ,
     * this is the date where the applicant is back to work
     * Non working days are ignored in this methods because they are also ignored in the consumption total
     *
     *
     * @return {Promise}
     */
    absenceElemSchema.methods.getWorkingDaysUntilBack = function() {

        let elem = this;
        let accountModel = elem.model('Account');

        let accountsPromise = accountModel.find().where('user.id', elem.user.id).exec();
        let eventsPromise = elem.getBoundaries();

        let dtend;

        return Promise.all([accountsPromise, eventsPromise])
		.then(all => {

            let accounts = all[0];
            let boundaries = all[1];

            if (0 === accounts.length) {
                throw new Error('No account found for user '+elem.user.id);
            }



            let dtstart = new Date(boundaries.dtstart);
            dtstart.setHours(0,0,0,0);
            dtend = boundaries.dtend;

            // we add one week to the end date to get the back to work day
            let endSearch = new Date(dtend);
            endSearch.setDate(endSearch.getDate()+8);
            endSearch.setHours(0,0,0,0);

            return accounts[0].getPeriodScheduleEvents(dtstart, endSearch);
        })
        .then(era => {

            // filter out the dates after the back to work date

            let events = [];

            let i=0, last = false;

            while (!last && undefined !== era.periods[i]) {
                let period = era.periods[i];
                if (period.dtstart > dtend) {
                    last = true;
                }

                events.push(period);
                i++;
            }

            return events;
        });

    };


    /**
     * Get the date where the user can be back to work
     * hours are ignored
     *
     * @return {Promise}    Date
     */
    absenceElemSchema.methods.getBackDate = function() {

		let elem = this;

        return elem.getWorkingDaysUntilBack().then(events => {

            if (events.length === 0) {
				return elem.getBoundaries().then(b => {
					throw new Error(util.format('There are no working periods beetween %s and %s', b.dtstart, b.dtend));
				});
            }

            let backDate = new Date(events[events.length-1].dtstart);
            backDate.setHours(0,0,0,0);
            return backDate;
        });
    };


    /**
     * Get the working days in the absence element period
     * @returns {Promise}   Number
     */
    absenceElemSchema.methods.getWorkingDays = function() {
        return new Promise((resolve, reject) => {
            this.getWorkingDaysUntilBack().then(events => {

                if (events.length === 0) {
                    throw new Error('Invalid back to work date from the getWorkingDaysUntilBack method');
                }

                events.pop();
                resolve(events.length);
            })
            .catch(reject);
        });
    };


    /**
     * Save linked event documents
     * @returns {Promise}
     */
    absenceElemSchema.methods.saveEvents = function() {
        let savedEvents = [];
        this.events.forEach(event => {
            savedEvents.push(event.save());
        });

        return Promise.all(savedEvents);
    };


	absenceElemSchema.set('autoIndex', params.autoIndex);

	params.db.model('AbsenceElem', absenceElemSchema);
};
