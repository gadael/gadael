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
        right: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'Right' },
            name: String,                                   // right created after approval in recovery by approver mode
            quantity_unit: { type: String, enum:['D', 'H'] },
            renewal: {                                      // open period for the recovery right
                id: { type: mongoose.Schema.Types.ObjectId, ref: 'RightRenewal' },
                start: Date,
                finish: Date
            }
        },
        summary: String,
        overtime: { type: mongoose.Schema.Types.ObjectId, ref: 'Overtime' } // set after approval if workperiod_recovery_by_approver == false
	});

	wpRecoverSchema.set('autoIndex', params.autoIndex);
    params.embeddedSchemas.WorperiodRecover = wpRecoverSchema;
};
