'use strict';



/**
 * An adjustment is a quantity added or subtracted to the default quantity of a right
 * for manual adjustment of the quantity on one account
 *
 * For adjustments on all beneficiaries, see RightAdjustment model (monthly updates)
 *
 * @param {Object} params
 */
exports = module.exports = function(params) {

    var mongoose = params.mongoose;

    var adjustmentSchema = new params.mongoose.Schema({
        rightRenewal: { type: mongoose.Schema.Types.ObjectId, ref: 'RightRenewal', required: true, index: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        timeCreated: { type: Date, default: Date.now },
        quantity: { type: Number, required: true },
        userCreated: {											// the user who create this adjustment
          id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          name: { type: String, default: '' }
        },
        comment: { type: String, default: '' },

        // If this is an auto adjustement, created because the the right configuration
        autoAdjustment: { type: Boolean, default: false }
    });



    /**
     * Update user stat linked to the current renewal
     * @param {Beneficiary} beneficiary     This is the beneficiary document used
     *                                      to link renewal and user
     * @return {Promise}
     */
    adjustmentSchema.methods.updateUsersStat = function(beneficiary) {
        let adjustment = this;

        let promises = [
            adjustment.populate('rightRenewal').execPopulate(),
            adjustment.populate('user').execPopulate()
        ];

        return Promise.all(promises)
        .then(() => {

            // ignore error on renewal
            // a simple catch does not work here
            return new Promise(resolve => {
                adjustment.rightRenewal.updateUserStat(adjustment.user, beneficiary)
                .catch(err => {
                    console.trace(err);
                    return resolve();
                })
                .then(resolve);
            });

        });
    };


    adjustmentSchema.set('autoIndex', params.autoIndex);

    adjustmentSchema.index({ name: 1 });
    params.db.model('Adjustment', adjustmentSchema);
};
