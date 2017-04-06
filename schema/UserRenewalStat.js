'use strict';

/**
 * Statitics for one user/renewal
 * This a is a user cache for the RightRenewal.getUserQuantityStats() method
 */
exports = module.exports = function(params) {

    let mongoose = params.mongoose;
	let userRenewalStatSchema = new mongoose.Schema({

        user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        renewal:    { type: mongoose.Schema.Types.ObjectId, ref: 'RightRenewal' },

        initial:    Number,
        consumed:   Number,
        deposits:   Number, // If the associated right is a time saving account, sum of quantities in deposits for this renewal
        available:  Number,
        waiting:    Number,
        daysratio:  Number  // A ratio to convert quantities in day
	});

    userRenewalStatSchema.set('autoIndex', params.autoIndex);
    params.db.model('UserRenewalStat', userRenewalStatSchema);
};
