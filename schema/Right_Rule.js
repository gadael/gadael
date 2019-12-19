'use strict';

const consumptionHistory = require('../modules/consumptionHistory');

/**
 * Right rules embeded into right document
 */
exports = module.exports = function(params) {

	const mongoose = params.mongoose;

    const ruleTypes = [
        'entry_date',       // right is visible when the entry date is in the interval
                            // min in days before the renewal start date
                            // max in days after the renewal end date

        'request_period',   // right is visible when request begin date >= computed min date
                            // and request end date <= computed max date
                            // min in days before the renewal start date
                            // max in days after the renewal end date

		'request_beneficiary', // right is visible when request begin date >= computed min date
							// and request end date <= computed max date
							// min in days before the beneficiary.from date
							// max in days after the beneficiary.to date
							// The rule is applicable only on rights linked directly to users

        'seniority',        // Right si visible if the user account seniority date
                            // is in the interval, min and max are in years before
                            // the entry date

        'age',              // Right is visible if the user age is in the interval
                            // min and max are in years after the birth date

		'consumption'		// Right is visible if the user have consumed between
							// min and max quantity on the specified right type
							// interval.unit can be H or D
							// rights from consumption.type not in the same unit will
							// ignored
							// All intervals consumption.periods.dtstart <=> consumption.periods.dtend
							// are computed with the specified month and day and the year
							// of the current request.timeCreated
    ];


	var rightRuleSchema = new mongoose.Schema({

        // title displayed to the user as a condition
        // to apply this vacation right
		title: { type: String, required: true },

        type: { type: String, enum: ruleTypes, required: true },

        interval: {
            min: { type: Number, default: 0 }, // number of days or number of years
            max: { type: Number, default: 0 }, // number of days or number of years
            unit: { type: String, enum: ['H', 'D', 'Y'], default: 'D' }
        },

		consumption: {
			periods: [{
				dtstart: Date,	// The year is ignored
				dtend: Date,	// The year is ignored
			}],
			type: { type: mongoose.Schema.Types.ObjectId, ref: 'Type' },
			cap: Number			// Ignore consumption of the next elements
								// if this quantity is already consumed
		},

        timeCreated: { type: Date, default: Date.now },
        lastUpdate: { type: Date, default: Date.now }
	});





    /**
     * Ensure that the interval is valid for the selected rule type
     * interval must have one value set
     * if the two values are set min must be < max
     */
    rightRuleSchema.pre('save', function (next) {

		const gt = params.app.utility.gettext;

		let rule = this;

        if (undefined === rule.interval || (undefined === rule.interval.min && undefined === rule.interval.max)) {
            next(new Error('At least one value must be set in interval to save the rule'));
            return;
        }

        let min = (undefined === rule.interval.min) ? null : rule.interval.min;
        let max = (undefined === rule.interval.max) ? null : rule.interval.max;



		switch(rule.type) {

            case 'age':
            case 'seniority':
                if (isNaN(min) || isNaN(max)) {
                    next(new Error(gt.gettext('Interval values must be numbers of years')));
                    return;
                }

                if (('seniority' === rule.type && min < max) || ('age' === rule.type && min > max)) {
                    next(new Error(gt.gettext('Interval values must be set in a correct order')));
                    return;
                }

            break;

            case 'entry_date':
            case 'request_period':
			case 'request_beneficiary':
                // no possible verification

            break;
        }




        next();

	});


    /**
     * Get dates interval from renewal
     * @return {Object}
     */
    rightRuleSchema.methods.getInterval = function(renewal) {
        var start = new Date(renewal.start);
        var finish = new Date(renewal.finish);

        if (undefined === this.interval.unit) {
            throw new Error('The interval unit is mandatory');
        }

        if ('D' === this.interval.unit) {
            start.setDate(start.getDate() - this.interval.min);
            finish.setDate(finish.getDate() + this.interval.max);
        }

        if ('Y' === this.interval.unit) {
            start.setFullYear(start.getFullYear() - this.interval.min);
            finish.setFullYear(finish.getFullYear() + this.interval.max);
        }

        return {
            dtstart: start,
            dtend: finish
        };
    };



    /**
     * Validate right rule
     * return false if the rule is not appliquable (ex: for request date when the request does not exists)
     *
     * @param {RightRenewal} renewal      Right renewal
     * @param {User}         user         Request appliquant
     * @param {Date}         dtstart        Request start date
     * @param {Date}         dtend          Request end date
     * @param {Date}         [moment]  		Request creation date
     * @return {Promise}	 Resolve to a boolean
     */
    rightRuleSchema.methods.validateRule = function(renewal, user, dtstart, dtend, moment) {

		let rule = this;

        switch(rule.type) {
            case 'seniority':       	return Promise.resolve(rule.validateSeniority(dtstart, dtend, user));
            case 'entry_date':      	return Promise.resolve(rule.validateEntryDate(moment, renewal));
            case 'request_period':  	return Promise.resolve(rule.validateRequestDate(dtstart, dtend, renewal));
			case 'request_beneficiary': return rule.validateRequestDateOnBeneficiary(dtstart, dtend, user);
            case 'age':             	return Promise.resolve(rule.validateAge(dtstart, dtend, user));
			case 'consumption':			return rule.validateConsuption(renewal, user);
        }

        return Promise.resolve(false);
    };


	/**
	 * Validate that the dtstart-dtend period is in the period set on beneficiary
	 * if no beneficiary linked to user, the rule is not valid
	 * if no period set on beneficiary, the rule is valid
	 *
	 * @param {Date} dtstart request period start date
	 * @param {Date} dtend request period end date
	 * @param {User} user The request appliquant
	 *
	 * @return {Promise}
	 */
	rightRuleSchema.methods.validateRequestDateOnBeneficiary = function(dtstart, dtend, user) {

		let Beneficiary = params.app.db.models.Beneficiary;

		return Beneficiary.findOne()
		.where('ref', 'User')
		.where('document', user._id)
		.where('right', this.parent()._id)
		.exec()
		.then(beneficiary => {
			if (null === beneficiary) {
				return false;
			}

			if (null !== beneficiary.from && (beneficiary.from.getTime() > dtstart.getTime())) {
				return false;
			}

			if (null !== beneficiary.to && (beneficiary.to.getTime() < dtend.getTime())) {
				return false;
			}

			return true;
		});
	};


	/**
	 * Test validity for consumption
	 *
	 * @param {Renewal} renewal		The moment of the request
	 * @param {User} user		The appliquant
	 *
	 * @returns {Promise}  resolve to a boolean
	 */
	rightRuleSchema.methods.validateConsuption = function(renewal, user) {

		let rule = this;

		let periods = rule.consumption.periods.map(period => {
			let dtstart = renewal.createDateFromDayMonth(period.dtstart);
			let dtend = renewal.createDateFromDayMonth(period.dtend);
			dtend.setHours(23,59,59,999);

			return {
				dtstart: dtstart,
				dtend: dtend
			};
		});

		return consumptionHistory.getConsumedQuantityBetween(user, [rule.consumption.type], periods, rule.interval.unit, renewal, rule.consumption.cap)
		.then(quantity => {
			if (quantity < rule.interval.min || quantity > rule.interval.max) {
				return false;
			}

			return true;
		});
	};



    /**
     * Create interval from one date
     * @throws {Error} 				If the interval unit is not year
     * @param   {Date} d          	reference date, ex birth date
     * @param   {String} operator   operator to use on date year
     * @returns {Array} 			min and max
     */
    rightRuleSchema.methods.getIntervalFromDate = function(d, operator) {

        let operators = {
            '+': function(a, b) { return a + b; },
            '-': function(a, b) { return a - b; }
        };

        let min, max;

        min = new Date(d);
        max = new Date(d);

        if ('Y' !== this.interval.unit) {
            throw new Error('The interval unit for this rule must be year');
        }

        let applyBoundary = operators[operator];

        min.setFullYear(applyBoundary(min.getFullYear(), this.interval.min));
        max.setFullYear(applyBoundary(max.getFullYear(), this.interval.max));

        return {
            min:min,
            max:max
        };
    };




    /**
     * test validity from the birth date
     *
     * @param {Date} dtstart        Request start date
     * @param {Date} dtend          Request end date
     * @param {User} user
     *
     * @return {boolean}
     */
    rightRuleSchema.methods.validateAge = function(dtstart, dtend, user) {

        if (undefined === user.populated('roles.account')) {
            throw new Error('The roles.account field need to be populated');
        }

        if (undefined === dtstart || null === dtstart) {
            return false;
        }

        let birth = user.roles.account.birth;

        if (undefined === birth || null === birth) {
            return false;
        }


        let i = this.getIntervalFromDate(birth, '+');



        if (dtstart < i.min || dtend > i.max) {
            return false;
        }


        return true;
    };










    /**
     * test validity from the seniority date
     * the seniority date is the previsional retirment date
     * @param {Date} dtstart        Request start date
     * @param {Date} dtend          Request end date
     * @param {User} user
     *
     * @return {boolean}
     */
    rightRuleSchema.methods.validateSeniority = function(dtstart, dtend, user) {

        if (undefined === user.populated('roles.account')) {
            throw new Error('The roles.account field need to be populated');
        }

        if (undefined === dtstart || null === dtstart) {
            return false;
        }

        var seniority = user.roles.account.seniority;

        if (undefined === seniority || null === seniority) {
            return false;
        }



        let i = this.getIntervalFromDate(seniority, '-');

        if (dtstart < i.min || dtend > i.max) {
            return false;
        }


        return true;
    };



    /**
     * Test validity from the request creation date
     * @param {Date}            moment
     * @param {RightRenewal}    renewal
     * @return {boolean}
     */
    rightRuleSchema.methods.validateEntryDate = function(moment, renewal) {
        let interval = this.getInterval(renewal);

		if (!(moment instanceof Date)) {
			throw new Error('moment must be a date');
		}

        if (moment >= interval.dtstart && moment <= interval.dtend) {
            return true;
        }

        return false;
    };

    /**
     * Test validity of all events in a request
     * @param {Date}         dtstart        Request start date
     * @param {Date}         dtend          Request end date
     * @param {RightRenewal} renewal
     * @return {boolean}
     */
    rightRuleSchema.methods.validateRequestDate = function(dtstart, dtend, renewal) {

        if (!dtstart||!dtend) {
            return false;
        }

        var interval = this.getInterval(renewal);

        if (dtstart < interval.dtstart || dtend > interval.dtend) {
            return false;
        }

        return true;
    };


    rightRuleSchema.set('autoIndex', params.autoIndex);

	params.embeddedSchemas.RightRule = rightRuleSchema;
};
