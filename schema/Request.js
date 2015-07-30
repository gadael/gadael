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
     * Get a displayable status, internationalized
     * @return {String}
     */
    requestSchema.methods.getDispStatus = function getDispStatus() {
        var Gettext = require('node-gettext');
        var gt = new Gettext();

        if (null !== this.status.created) {
            switch(this.status.created) {
                case 'waiting':
                    return gt.gettext('Waiting approval');
                case 'accepted':
                    return gt.gettext('Accepted');
                case 'rejected':
                    return gt.gettext('Rejected');
            }
        }


        if (null !== this.status.deleted) {
            switch(this.status.deleted) {
                case 'waiting':
                    return gt.gettext('Waiting deletion approval');
                case 'accepted':
                    return gt.gettext('Deleted');
                case 'rejected':
                    return gt.gettext('Deletion rejected');
            }
        }

        return gt.gettext('Undefined');
    };

    /**
     * Get last request log inserted for the approval workflow
     * @return {RequestLog}
     */
    requestSchema.methods.getlastApprovalRequestLog = function getlastApprovalRequestLog() {
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
    requestSchema.methods.getLastApprovalStep = function getLastApprovalStep() {

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
    requestSchema.methods.getNextApprovalStep = function getNextApprovalStep() {



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
    requestSchema.methods.forwardApproval = function forwardApproval(nextStep) {

        nextStep.status = 'waiting';

        // TODO send message to managers of the nextStep
    };



    /**
     * Update document when an approval step has been accepted
     * @param {ApprovalStep} approvalStep
     * @param {User} user
     * @param {String} comment
     */
    requestSchema.methods.accept = function accept(approvalStep, user, comment) {

        // update approval step

        approvalStep.status = 'accepted';
        this.addLog('wf_accept', user, comment, approvalStep);


        var nextStep = this.getNextApprovalStep();

        if (null === nextStep) {
            throw new Error('Nothing to accept');
        }

        if (false === nextStep || approvalStep._id === nextStep._id) {
            this.addLog('wf_end', user);

            if ('waiting' === this.status.created) {
                this.status.created = 'accepted';
            }

            if ('waiting' === this.status.deleted) {
                this.status.deleted = 'accepted';
                this.addLog('delete', user, null, approvalStep);
            }

            // TODO notify appliquant
            return;
        }

        // add log entry
        this.forwardApproval(nextStep);
    };


    /**
     * Update document when an approval step has been rejected
     * @param {ApprovalStep} approvalStep
     * @param {User} user
     * @param {String} comment
     */
    requestSchema.methods.reject = function reject(approvalStep, user, comment) {

        approvalStep.status = 'rejected';

         // add log entry
         this.addLog('wf_reject', user, comment, approvalStep);

        if ('waiting' === this.status.created) {
            this.status.created = 'rejected';
        }

        if ('waiting' === this.status.deleted) {
            this.status.deleted = 'rejected';
        }
    };


    /**
     * Set status for all events associated to the request
     * @param {String} status   TENTATIVE | CONFIRMED | CANCELLED
     * @return {Promise}
     */
    requestSchema.methods.setEventsStatus = function setEventsStatus(status) {

        var Q = require('q');

        if (undefined === this.populated('events')) {
            throw new Error('The events path shoud be populated on request');
        }

        var promises = [];

        for(var i=0; i< this.events.length; i++) {
            this.events[i].status = status;
            promises.push(this.events[i].save());
        }

        return Q.all(promises);
    };


    /**
    * Add a log document to request
    * @param {String} action
    * @param {String} comment
    * @param {ApprovalStep} approvalStep
    *
    */
    requestSchema.methods.addLog = function addLog(action, user, comment, approvalStep) {

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
