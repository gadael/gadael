'use strict';

exports = module.exports = function(params) {
	
	var mongoose = params.mongoose;
	var approvalStepSchema = new mongoose.Schema({
    
        department: String,                                                // department name used to create this approval step
		approvers: [mongoose.Schema.Types.ObjectId],			           // list of users
                                                                           // user model is not specified because this schema is embeded into
                                                                           // the request model, linked to user model
 		operator: { type: String, enum: ['OR', 'AND'], required: true },   // approvers operator for step validation
		timeCreated: { type: Date, default: Date.now }
	});
  
	approvalStepSchema.set('autoIndex', params.autoIndex);

    params.embeddedSchemas.ApprovalStep = approvalStepSchema;
};
