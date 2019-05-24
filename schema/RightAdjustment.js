'use strict';


/**
 * Right adjustements is a modification of renewal initial quantity for all beneficiaries
 * For modification of quantity for one account only, see the Adjustment model
 */
exports = module.exports = function(params) {
    var rightAdjustmentSchema = new params.mongoose.Schema({
        from: {
            type: Date,
            required: true,
            validate: function(x) {
                // adjustment do not modify quantity in the past,
                // if the right is modified only the future adjustments are modified
                return (x > Date.now() );
            }
        },
        quantity: {
            type: Number,
            required: true,
            validate: function(x) {
                // removing quantity via monthly update is allowed (probably not usefull)
                // but empty adjustment is not allowed
                return (x !== 0);
            }
        }
    });

    rightAdjustmentSchema.set('autoIndex', params.autoIndex);
    params.embeddedSchemas.RightAdjustment = rightAdjustmentSchema;
};
