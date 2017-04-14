'use strict';

exports = module.exports = function(params) {
	var mongoose = params.mongoose;
	var acSchema = new mongoose.Schema({
		account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
		rightCollection: { type: mongoose.Schema.Types.ObjectId, ref: 'RightCollection' , required: true },
		from: { type: Date, required: true },		// Do not modify if in the past
		to: { type: Date },							// Do not modify if in the past, this can be null
        createEntriesFrom: { type: Date },          // if not set, entries creation allways allowed
        createEntriesTo: { type: Date },            // if not set, entries creation allways allowed
		timeCreated: { type: Date, default: Date.now }
	});






	acSchema.pre('save', function(next) {

		var accountCollection = this;

		if (null !== accountCollection.to && accountCollection.to <= accountCollection.from) {
			next(new Error('Collection end date must be greater than the start date'));
			return;
		}

        var createEntries = (null !== accountCollection.createEntriesFrom && null !== accountCollection.createEntriesTo);

        if (createEntries && accountCollection.createEntriesTo <= accountCollection.createEntriesFrom) {
			next(new Error('Collection create entries end date must be greater than the create entries start date'));
			return;
		}


        var testOverlap = require('../modules/testoverlap');

		// verify that the new period start date is greater than all other dates
		var model = params.db.models.AccountCollection;
		model.find({ account: this.account })
		.sort('from')
		.exec(function(err, acEntries) {

			if (!acEntries) {
				return next();
			}

			for(var i=0; i < acEntries.length; i++) {

				if (acEntries[i].to === null && 1+i !== acEntries.length) {
					next(new Error('All collections except the last must have a end date'));
					return;
				}

                if (acEntries[i].to === null && i === acEntries.length && accountCollection._id !== acEntries[i]._id) {
					next(new Error('To add a new collection period, all other collections must have a end date'));
					return;
				}

                if (!accountCollection._id.equals(acEntries[i]._id) && !testOverlap(acEntries[i], accountCollection)) {
                    next(new Error('The collection period must begin after the previous collection end date'));
                    return;
                }

			}

			next();
		});
	});

	/**
	 * @return {Promise}
	 */
	acSchema.methods.getUser = function() {
		const User = this.model('User');
		return User.findOne({ 'roles.account': this.account })
		.exec();
	};


	/**
	 * Update user stat
	 * @return {Promise}
	 */
	acSchema.methods.updateUserStat = function() {
		return this.getUser()
		.then(user => {
			return user.updateRenewalsStat();
		});
	};


	acSchema.set('autoIndex', params.autoIndex);

	acSchema.index({ account: 1 });
	acSchema.index({account: 1, rightCollection: 1, from: 1}, { unique: true });


	params.db.model('AccountCollection', acSchema);

};
