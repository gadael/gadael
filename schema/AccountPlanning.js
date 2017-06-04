'use strict';

exports = module.exports = function(params) {

    const mongoose = params.mongoose;

    let apSchema = new mongoose.Schema({
		account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
		calendar: { type: mongoose.Schema.Types.ObjectId, ref: 'Calendar' , required: true },
		from: { type: Date, required: true },		// Do not modify if in the past
		to: { type: Date },							// Do not modify if in the past
		timeCreated: { type: Date, default: Date.now }
	});

	apSchema.set('autoIndex', params.autoIndex);

	apSchema.index({ account: 1 });
	apSchema.index({account: 1, calendar: 1, from: 1}, {unique: true});





	apSchema.pre('save', function (next) {

		var accountPlanningCalendar = this;

		if (null !== accountPlanningCalendar.to && accountPlanningCalendar.to <= accountPlanningCalendar.from) {
			next(new Error('Schedule calendar end date must be greater than the start date'));
			return;
		}

        var testOverlap = require('../modules/testoverlap');

		// verify that the new period start date is greater than all other dates
		accountPlanningCalendar.constructor.find({ account: accountPlanningCalendar.account }).sort('from').exec(function(err, acEntries) {

			for(var i=0; i < acEntries.length; i++) {

				if (acEntries[i].to === null && i !== (acEntries.length - 1)) {
					next(new Error('All schedule calendars except the last must have a end date'));
					return;
				}

                if (acEntries[i].to === null && i === acEntries.length && accountPlanningCalendar._id !== acEntries[i]._id) {
					next(new Error('To add a new schedule period, all other scheduled calendars must have a end date'));
					return;
				}

                if (!accountPlanningCalendar._id.equals(acEntries[i]._id) && !testOverlap(acEntries[i], accountPlanningCalendar)) {
                    next(new Error('The schedule period must begin after the previous schedule period end date'));
                    return;
                }

			}

			next();
		});
	});


    apSchema.methods.updateUsersStat = function() {
        // update account stats


        const User = this.model('User');
        return User.findOne()
        .where('roles.account', this.account)
        .exec()
        .then(user => {
            return user.updateRenewalsStat();
        });

    };

    return apSchema;
};
