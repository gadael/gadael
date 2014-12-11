'use strict';



/**
 * An adjustment is a quantity added or subtracted to the default quantity of a right
 * for manual adjustment of the quantity on one account
 * @param {Object} params
 */
exports = module.exports = function(params) {
    
    var mongoose = params.mongoose;
    
    var adjustmentSchema = new params.mongoose.Schema({
        rightRenewal: { type: mongoose.Schema.Types.ObjectId, ref: 'RightRenewal', required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        timeCreated: { type: Date, default: Date.now },
        quantity: { type: Number, required: true },
        userCreated: {											// the user who create this adjustment
          id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          name: { type: String, default: '' }
        },
        comment: { type: String, default: '' }
    });
  
    adjustmentSchema.set('autoIndex', params.autoIndex);
  
    adjustmentSchema.index({ name: 1 });
    params.db.model('Adjustment', adjustmentSchema);
};
