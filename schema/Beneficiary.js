'use strict';

exports = module.exports = function(params) {

    var mongoose = params.mongoose;

    var beneficiarySchema = new params.mongoose.Schema({
        right: { type: mongoose.Schema.Types.ObjectId, ref: 'Right', required: true },

        // right can be linked to a collection or to a user
        document: { type: mongoose.Schema.Types.ObjectId, required: true },

        // "User" can be used only with rights not linked to a collection
        // "RightCollection" can be used only with rights not linked to a user
        // beneficiary with ref=User is used for recovery rights created after
        // validation of a recovery request
        ref: { type: String, enum: ['User', 'RightCollection'], required: true, index: true },
        timeCreated: { type: Date, default: Date.now }
    });



    beneficiarySchema.set('autoIndex', params.autoIndex);
    beneficiarySchema.index({ right: 1, document: 1 }, { unique: true });
    params.db.model('Beneficiary', beneficiarySchema);
};
