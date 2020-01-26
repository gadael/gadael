'use strict';

exports = module.exports = function(params) {
	const mongoose = params.mongoose;

	var overtimeSettlementSchema = new mongoose.Schema({
		comment: { type: String, default: '' },							// Admin comment
		userCreated: {
		  id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		  name: { type: String, default: '' }
		},
		timeCreated: { type: Date, default: Date.now },
        quantity: { type: Number, required: true },                     // quantity input from admin
        right: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'Right' },
            name: String
        }
	});

	overtimeSettlementSchema.set('autoIndex', params.autoIndex);
    params.embeddedSchemas.OvertimeSettlement = overtimeSettlementSchema;
};
