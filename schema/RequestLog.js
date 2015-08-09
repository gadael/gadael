'use strict';

exports = module.exports = function(params) {
	
	var mongoose = params.mongoose;	

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
		timeCreated: { type: Date, default: Date.now },

        approvalStep: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalStep' }
	});


    /**
     * @return {String}
     */
    requestLogSchema.methods.getActionSummary = function getActionSummary() {
        var Gettext = require('node-gettext');
        var gt = new Gettext();

        switch(this.action) {
            case 'create':
                return gt.gettext('Create request');
            case 'wf_sent':
                return gt.gettext('Send request to approval');
            case 'wf_accept':
                return gt.gettext('Approval step accepted');
            case 'wf_reject':
                return gt.gettext('Approval step rejected');
            case 'wf_end':
                return gt.gettext('Approval workflow end');
            case 'modify':
                return gt.gettext('Modify request');
            case 'delete':
                return gt.gettext('Delete request');
        }

        return gt.gettext('Unknown action');
    };

  
	requestLogSchema.set('autoIndex', params.autoIndex);
  
	//params.db.model('RequestLog', requestLogSchema);

    params.embeddedSchemas.RequestLog = requestLogSchema;
};

