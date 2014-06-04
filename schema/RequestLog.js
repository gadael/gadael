'use strict';

exports = module.exports = function(app, mongoose) {
	
  var requestActions = [
		'create',		// request created (previsonal request if no sent step or end at same date)
		'wf_sent',		// request is created and sent for approval
		'wf_accept',	// approver accept approval step
		'wf_reject',	// approver reject approval step
		'wf_end',		// notification sent to applicant with approval status
		'modify',		// request modified
		'delete'		// request deleted
	];
	
  var requestLogSchema = new mongoose.Schema({
    comment: { type: String, default: '' },							// Approver comment
    action: { type: String, enum: requestActions },
    userCreated: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' }							// Name to display in request history
    },
    timeCreated: { type: Date, default: Date.now }
  });
  app.db.model('RequestLog', requestLogSchema);
};

