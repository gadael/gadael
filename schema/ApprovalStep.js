'use strict';

exports = module.exports = function(params) {
	
	var mongoose = params.mongoose;
	var approvalStepSchema = new mongoose.Schema({
    
		approvers: [mongoose.Schema.Types.ObjectId],			// list of users or department
		operator: { type: String, enum: ['OR', 'AND'] },		// approvers operator for step validation
		timeCreated: { type: Date, default: Date.now }
	});
  
	approvalStepSchema.set('autoIndex', params.autoIndex);
	params.db.model('ApprovalStep', approvalStepSchema);
};
