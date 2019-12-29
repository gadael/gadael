'use strict';


/**
 *
 */
exports = module.exports = function(params) {
	var mongoose = params.mongoose;
	var wpRecoverSchema = new mongoose.Schema({
        recoverQuantity: { type: mongoose.Schema.Types.ObjectId, ref: 'RecoverQuantity' },
        quantity: { type: Number, required: true },         // quantity equal du duration of period in the planning
        gainedQuantity: { type: Number, required: true },   // quantity earned from recovery of the period, can be modified by approvers
        waitingSettlementQuantity: { type: Number, required: true },
        settledQuantity: Number,
        right: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'Right' },
            name: String,                                   // right created after approval in recovery by aprover mode
            quantity_unit: { type: String, enum:['D', 'H'], required: true },
            renewal: {                                      // open period for the recovery right
                id: { type: mongoose.Schema.Types.ObjectId, ref: 'RightRenewal' },
                start: Date,
                finish: Date
            }
        }
	});

	wpRecoverSchema.set('autoIndex', params.autoIndex);
    params.embeddedSchemas.WorperiodRecover = wpRecoverSchema;
};
