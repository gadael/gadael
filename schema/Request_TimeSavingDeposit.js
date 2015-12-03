'use strict';


/**
 *
 */
exports = module.exports = function(params) {
	var mongoose = params.mongoose;

    var rightRenewalReference = {
        right: { type: mongoose.Schema.Types.ObjectId, ref: 'Right', required: true },
        name: { type: String, required: true },

        renewal: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'RightRenewal', required: true },
            start: { type: Date, required: true },
            finish: { type: Date, required: true }
        }
    };

	var timeSavingDepositSchema = new mongoose.Schema({

        quantity: { type: Number, required: true }, // quantity to move to the time saving account account
        quantity_unit: { type: String, enum:['D', 'H'], required: true },

        from: rightRenewalReference,
        to: rightRenewalReference

	});




	timeSavingDepositSchema.set('autoIndex', params.autoIndex);

    params.embeddedSchemas.TimeSavingDeposit = timeSavingDepositSchema;
};
