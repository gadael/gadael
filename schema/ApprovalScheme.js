'use strict';

exports = module.exports = function(params) {
	var mongoose = params.mongoose;
	var approvalSchemeSchema = new mongoose.Schema({
		name: { type: String, required: true, unique: true },
		steps: [mongoose.modelSchemas.approvalStep],
		timeCreated: { type: Date, default: Date.now }
	});
	
	approvalSchemeSchema.set('autoIndex', params.autoIndex);
	params.db.model('ApprovalScheme', approvalSchemeSchema);
};


