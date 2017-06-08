'use strict';

/**
 * Statitics for one user/renewal
 * This a is a user cache for the RightRenewal.getUserQuantityStats() method
 *
 * The documents store consumption and initial quantity, as a consequence,
 * data must be computed for every modification of :
 *  - Request               for all entries of the appliquant
 *  - Right                 for all entries linked to renewals of the right
 *  - RightRenewal          for all entries linked to renewal
 *  - Adjustment            for the corresponding entry
 *  - AccountCollection     for all entries of the account
 *
 * Validity end date of the cache is retrived from the validity
 * period of the beneficiary and the accountCollection
 */
exports = module.exports = function(params) {

    let mongoose = params.mongoose;
	let userRenewalStatSchema = new mongoose.Schema({

        user:               { type: mongoose.Schema.Types.ObjectId, ref: 'User'         , required: true },
        renewal:            { type: mongoose.Schema.Types.ObjectId, ref: 'RightRenewal' , required: true },
        beneficiary:        { type: mongoose.Schema.Types.ObjectId, ref: 'Beneficiary'  , required: true },
        accountCollection:  { type: mongoose.Schema.Types.ObjectId, ref: 'AccountCollection' },

        right: {
            id:             { type: mongoose.Schema.Types.ObjectId, ref: 'RightRenewal' , required: true },
            name:           { type: String, required: true },
            type: {
                name: String,
                color: String
            }
        },

        initial:            Number,
        consumed:           Number,
        deposits:           Number, // If the associated right is a time saving account, sum of quantities in deposits for this renewal
        available:          Number,
        waiting: {
            created:        Number,
            deleted:        Number
        },
        daysratio:          Number, // A ratio to convert quantities in day

        timeCreated: { type: Date, default: Date.now },

        error:              String,

        rtt: {  // for RTT special rights, store details for the initial quantity computation
            agreementWorkedDays: Number,
            renewalDays: Number,
            weekEnds: Number,
            paidLeaves: Number,
            nonWorkingDays: Number
        }
	});


    /**
     * Test cache validity against a date
     * @param {Date} moment
     * @return {Promise}
     */
    userRenewalStatSchema.methods.isValid = function(moment) {

        let renewalStat = this;

        if (undefined === moment) {
            moment = new Date();
        }

        return Promise.all([
            renewalStat.populate('beneficiary').execPopulate(),
            renewalStat.populate('accountCollection').execPopulate()
        ])
        .then(() => {
            let minDate = renewalStat.beneficiary.to;
            if (undefined !== renewalStat.accountCollection && undefined !== renewalStat.accountCollection.to) {
                if (minDate > renewalStat.accountCollection.to) {
                    minDate = renewalStat.accountCollection.to;
                }
            }

            return (minDate > moment);
        });

    };

    userRenewalStatSchema.set('autoIndex', params.autoIndex);
    params.db.model('UserRenewalStat', userRenewalStatSchema);
};
