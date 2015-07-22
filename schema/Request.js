'use strict';

exports = module.exports = function(params) {
	
	var mongoose = params.mongoose;
	
    var requestSchema = new mongoose.Schema({
    user: { // owner
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        department: String
    },

    timeCreated: { type: Date, default: Date.now },

    createdBy: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true }
    },

    events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CalendarEvent' }],   // for absence or workperiod_recover
                                                                                // duplicated references to events

    absence: {
        rightCollection: { type: mongoose.Schema.Types.ObjectId, ref: 'RightCollection' },
        distribution: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AbsenceElem' }]
    },

    time_saving_deposit: {
        from: { type: mongoose.Schema.Types.ObjectId, ref: 'Right' },
        to: { type: mongoose.Schema.Types.ObjectId, ref: 'Right' },
        quantity: { type: Number }
    },

    workperiod_recover: {
        event: { type: mongoose.Schema.Types.ObjectId, ref: 'CalendarEvent' },
        user_right: { type: mongoose.Schema.Types.ObjectId, ref: 'Right' }
    },

    status: {                                                       // approval status for request creation or request deletion
        created: { type: String, enum: [ null, 'waiting', 'accepted', 'rejected' ], default: null },
        deleted: { type: String, enum: [ null, 'waiting', 'accepted', 'rejected' ], default: null }
    },

    approvalSteps: [params.embeddedSchemas.ApprovalStep],			// on request creation, approval steps are copied and contain references to users
                                                                    // informations about approval are stored in requestLog sub-documents instead
                                                                    // first position in array is the last approval step (top level department in user deparments ancestors)

    requestLog: [params.embeddedSchemas.RequestLog]					// linear representation of all actions
                                                                    // create, edit, delete, and effectives approval steps
    });




    /**
     * Get last request log inserted for the approval workflow
     * @return {RequestLog}
     */
    requestSchema.methods.getlastApprovalRequestLog = function() {
        for(var i=this.requestLog.length-1; i>=0; i--) {
            if (this.requestLog[i].approvalStep !== undefined) {
                return this.requestLog[i];
            }
        }

        return null;
    };


    /**
     * Get the last approval step with a saved item in request log
     * @return {ApprovalStep}
     */
    requestSchema.methods.getLastApprovalStep = function() {

        if (this.approvalSteps === undefined) {
            return null;
        }

        if (0 === this.approvalSteps.length) {
            return null;
        }

        var log = this.getlastApprovalRequestLog();

        if (null === log) {
            // nothing done about approval
            return null;
        }

        return this.approvalSteps.id(log.approvalStep);
    };




    /**
     * Get next approval step
     * return false if the last approval step in log was the last step in request
     *
     * @return {ApprovalStep|false}
     */
    requestSchema.methods.getNextApprovalStep = function() {



        if (0 === this.approvalSteps.length) {
            return null;
        }

        var last = this.getLastApprovalStep();



        if (null === last) {
            return this.approvalSteps[0];
        }


        for(var i=this.approvalSteps.length-1; i>=0; i--) {
            if (this.approvalSteps[i]._id === last._id) {
                i--;
                break;
            }
        }


        if (this.approvalSteps[i] === undefined) {
            return false;
        }

        return this.approvalSteps[i];
    };



    /**
     * If last approval step is confirmed, notify the appliquant
     * otherwise notify the next manager using approvalsteps
     * @param {ApprovalStep} nextStep
     */
    requestSchema.methods.forwardApproval = function(nextStep) {

        nextStep.status = 'waiting';

        // TODO send message to managers of the nextStep
    };



    /**
     * @param {ApprovalStep} approvalStep
     * @param {User} user
     * @param {String} comment
     */
    requestSchema.methods.accept = function(approvalStep, user, comment) {

        // update approval step

        approvalStep.status = 'accepted';
        this.addLog('wf_accept', user, comment, approvalStep);


        var nextStep = this.getNextApprovalStep();

        if (null === nextStep) {
            throw new Error('Nothing to accept');
        }

        if (false === nextStep || approvalStep._id === nextStep._id) {
            this.addLog('wf_end', user);
            // TODO notify appliquant
            return;
        }

        // add log entry
        this.forwardApproval(nextStep);
    };

    /**
     * @param {ApprovalStep} approvalStep
     * @param {User} user
     * @param {String} comment
     */
    requestSchema.methods.reject = function(approvalStep, user, comment) {

        approvalStep.status = 'rejected';


         // add log entry
         this.addLog('wf_reject', user, comment, approvalStep);
    };


    /**
    * Add a log document to request
    * @param {String} action
    * @param {String} comment
    * @param {ApprovalStep} approvalStep
    *
    */
    requestSchema.methods.addLog = function(action, user, comment, approvalStep) {

        var log = {};

        log.action = action;
        log.comment = comment;
        log.userCreated = {
            id: user._id,
            name: user.getName()
        };

        if (approvalStep !== undefined) {
            log.approvalStep = approvalStep._id;
        }

        if (this.requestLog === undefined) {
            this.requestLog = [];
        }

        this.requestLog.push(log);
    };



    requestSchema.index({ 'user.id': 1 });
    requestSchema.set('autoIndex', params.autoIndex);

    params.db.model('Request', requestSchema);
};
