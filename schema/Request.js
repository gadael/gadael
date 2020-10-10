'use strict';


/**
 * array map function to get Id from the document or ID
 * @param   {object|ObjectId}   document [[Description]]
 * @returns {ObjectId} [[Description]]
 */
function mapId(document) {
    return undefined === document._id ? document : document._id;
}

function getRemovePromises(documents) {
    let promises = [];
    documents.forEach(doc => {
        promises.push(doc.remove());
    });

    return Promise.all(promises);
}



exports = module.exports = function(params) {

	const mongoose = params.mongoose;

    var requestSchema = new mongoose.Schema({
        user: { // owner
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
            name: { type: String, required: true },
            department: String
        },

        timeCreated: { type: Date, default: Date.now },
        lastUpdate: { type: Date, default: Date.now },

        createdBy: {
          id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          name: { type: String, required: true }
        },

        events: [{                                                              // for absence or workperiod_recover
            type: mongoose.Schema.Types.ObjectId, ref: 'CalendarEvent'          // for absences, the events match working periods
        }],                                                                     // duplicated from absence.distribution.events
                                                                                // for workperiod_recover, the events are in non working periods

        absence: {
            dtstart: Date,                                                      // dtstart from first event
            dtend: Date,                                                        // dtend from last event
            rightCollection: { type: mongoose.Schema.Types.ObjectId, ref: 'RightCollection' },
            distribution: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AbsenceElem' }],
            compulsoryLeave: { type: mongoose.Schema.Types.ObjectId, ref: 'CompulsoryLeave' }
        },

        time_saving_deposit: [params.embeddedSchemas.TimeSavingDeposit],

        workperiod_recover: [params.embeddedSchemas.WorperiodRecover],

        status: {                                                               // approval status for request creation or request deletion
            created: { type: String, enum: [ null, 'waiting', 'accepted', 'rejected' ], default: null },
            deleted: { type: String, enum: [ null, 'waiting', 'accepted', 'rejected' ], default: null }
        },

        approvalSteps: [params.embeddedSchemas.ApprovalStep],			        // on request creation, approval steps are copied and contain references to users
                                                                                // informations about approval are stored in requestLog sub-documents instead
                                                                                // first position in array is the last approval step (top level department in user deparments ancestors)

        requestLog: [params.embeddedSchemas.RequestLog],				        // linear representation of all actions
                                                                                // create, edit, delete, and effectives approval steps

        validInterval: [params.embeddedSchemas.ValidInterval],                  // list of dates interval where the request is confirmed
                                                                                // absence: the quantity is consumed
                                                                                // time saving deposit: the quantity is available is time saving account
                                                                                // workperiod recover: the quantity is available in recovery right

        messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }]    // List of emails sent for this request
                                                                                // each new mail will use the message Ids to stay in the same conversation
    });







    /**
     * Register pre remove hook
     */
    requestSchema.pre('remove', function preRemoveHook(next) {

        let request = this;

        Promise.all([
            request.removeAbsenceDistribution(),
            request.removeEvents()
        ])
        .then(() => {
            next();
        })
        .catch(next);
    });


    requestSchema.post('remove', function postSaveHook(request) {
        request.updateAutoAdjustments();
    });


    /**
     * refresh appliquant renewals stat cache
     * @return {Promise}
     */
    requestSchema.methods.updateRenewalsStat = function() {

        let statDate = this.timeCreated;
        if (undefined !== this.events[0]) {
            statDate = this.events[0].dtstart;
        }

        return this.getUser()
        .then(user => {
            return user.updateRenewalsStat(statDate);
        });
    };


    /**
     * Update auto adjustments for all rights associated to request recipient
     * @return {Promise}
     */
    requestSchema.methods.updateAutoAdjustments = function() {

        let request = this;

        if (!request.absence || !request.absence.dtstart) {
            return Promise.resolve(true);
        }

        return request.getUser()
        .then(user => {
            return user.updateAutoAdjustments(request.absence.dtstart);
        })
        .then(() => {
            let Model = request.constructor;
            if (undefined !== Model.autoAdjustmentUpdated) {
                // this is for tests
                return Model.autoAdjustmentUpdated();
            }
            return true;
        });
    };


    /**
     * Get request owner user
     * @return {Promise}
     */
    requestSchema.methods.getUser = function() {
        return this.populate('user.id')
        .execPopulate()
        .then(populatedRequest => {
            return populatedRequest.user.id;
        });
    };

    /**
     * Remove absence distribution
     * @return {Promise}
     */
    requestSchema.methods.removeAbsenceDistribution = function() {

        let request = this;

        if (undefined === request.absence ||
            undefined === request.absence.distribution ||
            request.absence.distribution.length === 0) {
            return Promise.resolve(false);
        }


        let distribution = request.absence.distribution;
        let elementIds = distribution.map(mapId);

        let AbsenceElem = request.model('AbsenceElem');

        return AbsenceElem.find({ _id: { $in: elementIds } }).exec()
        .then(getRemovePromises);
    };


    /**
     * Remove all linked calendar events
     * @return {Promise}
     */
    requestSchema.methods.removeEvents = function() {
        let request = this;

        if (undefined === request.events ||
            undefined === request.events.length === 0) {
            return Promise.resolve(false);
        }

        let eventIds = request.events.map(mapId);

        let CalendarEvent = request.model('CalendarEvent');

        return CalendarEvent.find({ _id: { $in: eventIds } }).exec()
        .then(getRemovePromises);
    };



    /**
     * For absence request get the total quantity according to dates only
     * @return {Number}
     */
    requestSchema.methods.getQuantity = function() {
        let quantity = 0;
        this.absence.distribution.forEach(elem => {
            quantity += elem.quantity;
        });

        return quantity;
    };


    /**
     * For absence request get the total consumed quantity
     * @return {Number}
     */
    requestSchema.methods.getConsumedQuantity = function() {
        let consumed = 0;
        this.absence.distribution.forEach(elem => {
            consumed += elem.consumedQuantity;
        });

        return consumed;
    };

    /**
     * Get the last request log at a Date
     * @return {RequestLog}
     */
    requestSchema.methods.getDateLog = function(moment) {

        if (!this.requestLog) {
            return null;
        }

        for (let i=this.requestLog.length-1; i>=0; i--) {
            if (moment < this.requestLog[i].timeCreated) {
                return this.requestLog[i];
            }
        }

        return null;
    };


    /**
     * Get the status of request on a Date
     * using the request log
     * For this to work, we make the assumption that we never come back on a delete
     *
     * @return object
     */
    requestSchema.methods.getDateStatus = function(moment) {
        let requestLog = this.getDateLog();

        if (null === requestLog) {
            return this.status;
        }

        switch(requestLog.action) {
            case 'create':
            case 'modify':
                return {
                    created: 'accepted',
                    deleted: null
                };

            case 'wf_sent':
            case 'wf_accept':
            case 'wf_reject':
                if ('accepted' === this.status.deleted) {
                    return {
                        created: null,
                        deleted: 'waiting'
                    };
                }

                return {
                    created: 'waiting',
                    deleted: null
                };

            case 'wf_end':
                if ('accepted' === this.status.deleted) {
                    return {
                        created: null,
                        deleted: 'accepted'
                    };
                }

                return {
                    created: 'accepted',
                    deleted: null
                };

            case 'delete':
                return {
                    created: null,
                    deleted: 'accepted'
                };
        }

    };


    /**
     * Get string used in public URL (type folder)
     * @return string
     */
    requestSchema.methods.getUrlPathType = function() {
        if (this.absence && this.absence.distribution.length > 0) {
            return 'absences';
        }

        if (this.time_saving_deposit && this.time_saving_deposit.length > 0) {
            return 'time-saving-deposits';
        }

        if (this.workperiod_recover && this.workperiod_recover.length > 0) {
            return 'workperiod-recovers';
        }

        return null;
    };


    /**
     * Get a displayable request type, internationalized
     * @return {String}
     */
    requestSchema.methods.getDispType = function getDispType() {

        const gt = params.app.utility.gettext;

        if (this.absence && this.absence.distribution.length > 0) {
            return gt.gettext('Leave');
        }

        if (this.time_saving_deposit && this.time_saving_deposit.length > 0) {
            return gt.gettext('Time saving deposit');
        }

        if (this.workperiod_recover && this.workperiod_recover.length > 0) {
            return gt.gettext('Overtime declaration');
        }

        return gt.gettext('Unknown');
    };


    /**
     * Get a displayable status, internationalized
     * @return {String}
     */
    requestSchema.methods.getDispStatus = function getDispStatus() {

        const gt = params.app.utility.gettext;

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
    requestSchema.methods.getLastApprovalRequestLog = function getLastApprovalRequestLog() {
        for(var i=this.requestLog.length-1; i>=0; i--) {
            if (this.requestLog[i].approvalStep !== undefined) {
                return this.requestLog[i];
            }
        }

        return null;
    };

    /**
     * Get last request log inserted, approval workflow is ignored
     * @example get the modification which initiated the workflow
     * @return {RequestLog}
     */
    requestSchema.methods.getLastNonApprovalRequestLog = function getLastNonApprovalRequestLog() {
        for(var i=this.requestLog.length-1; i>=0; i--) {
            if (this.requestLog[i].approvalStep === undefined) {
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

        var log = this.getLastApprovalRequestLog();

        if (null === log) {
            // nothing done about approval
            return null;
        }

        return this.approvalSteps.id(log.approvalStep);
    };


    /**
     * Get the waiting approval step or null
     * @return {ApprovalStep}
     */
    requestSchema.methods.getWaitingApprovalStep = function getWaitingApprovalStep() {
        if (this.approvalSteps === undefined) {
            return null;
        }

        let steps = this.approvalSteps.filter(step => {
            return (step.status === 'waiting');
        });

        if (0 === steps.length) {
            return null;
        }

        if (1 !== steps.length) {
            throw new Error('Unexpected number of waiting steps on request '+this._id);
        }

        return steps[0];
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
     * Get the list of approvers without reply on the approval step
     * @param {ApprovalStep} approvalStep
     * @return {Array}      Array of user ID (mongoose objects)
     */
    requestSchema.methods.getRemainingApprovers = function getRemainingApprovers(approvalStep) {

        var interveners = [];

        this.requestLog.forEach(function(log) {

            if (undefined === log.approvalStep || !log.approvalStep.equals(approvalStep._id)) {
                return;
            }

            if (undefined === log.userCreated) {
                throw new Error('Wrong format in request log');
            }

            if (log.userCreated.id instanceof mongoose.Types.ObjectId) {
                interveners.push(log.userCreated.id.toString());
            } else {
                interveners.push(log.userCreated.id.id);
            }
        });

        var approvers = approvalStep.approvers.filter(function(approver) {

            if (approver.id instanceof mongoose.Types.ObjectId) {
                approver = approver.id.toString();
            } else {
                approver = approver.toString();
            }

            return (-1 === interveners.indexOf(approver));
        });

        return approvers;
    };


    /**
     * @return {Array} array of string
     */
    requestSchema.methods.getRemainingApproversOnWaitingSteps = function() {
        var approvers = [];
        var request = this;

        function feApprover(approver) {
            approver = approver.toString();
            if (-1 === approvers.indexOf(approver)) {
                approvers.push(approver);
            }
        }

        this.approvalSteps.forEach(function(step) {
            if (step.status !== 'waiting') {
                return;
            }

            request.getRemainingApprovers(step).forEach(feApprover);
        });

        return approvers;
    };


    /**
     * Create recovery right from request
     * @return {Promise}
     */
    requestSchema.methods.createRecoveryRight = function createRecoveryRight() {


        if (undefined === this.workperiod_recover || 0 === this.workperiod_recover.length) {
            return Promise.resolve(null);
        }


        var recover = this.workperiod_recover[0];
        var request = this;

        /**
         * @param {apiService   service
         * @param {Object} wrParams
         * @return {Promise}
         */
        function createRight()
        {
            var rightModel = request.model('Right');

            var right = new rightModel();
            right.name = recover.right.name;
            right.type = '5740adf51cf1a569643cc50a';
            right.quantity = recover.quantity;
            right.quantity_unit = recover.right.quantity_unit;
            right.rules = [{
                title: 'Active for request dates in the renewal period',
                type: 'request_period'
            }];

            return right.save();
        }


        return createRight()
        .then(right => {

            if (null === right) {
                return request;
            }

            recover.right.id = right._id;

            return right.createRecoveryRenewal(request)
            .then(renewal => {

                if (undefined === renewal._id) {
                    throw new Error('The new renewal ID is required');
                }

                recover.right.renewal.id = renewal._id;
                return request.save();
            })
            .then(() => {
                return right;
            });
        });

    };

    /**
     * Create overtime
     * @param {User}        user            Request owner
     * @return {Promise}    resolve to the Overtime document or null if overtime has not been created
     */
    requestSchema.methods.createOvertime = function(user)
    {
        if (1 !== this.workperiod_recover.length || params.app.config.company.workperiod_recovery_by_approver) {
            return Promise.resolve(null);
        }

        const recover = this.workperiod_recover[0];
        const request = this;
        const Overtime = request.model('Overtime');

        var overtime = new Overtime();
        overtime.user = request.user;
        overtime.day = request.events[0].dtstart;
        overtime.events = request.events;
        overtime.quantity = recover.gainedQuantity;
        overtime.settled = false;
        overtime.settlements = [];

        return overtime.save()
        .then(overtime => {
            recover.overtime = overtime._id;
            return request.save()
            .then(() => {
                return overtime;
            });
        });
    };

    /**
     * Create right and beneficiary
     * resolve to null if the request is not a recovery request
     * @param {User}        user            Request owner
     * @return {Promise}    resolve to the Beneficiary document or null if right has not been created
     */
    requestSchema.methods.createRecoveryBeneficiary = function(user)
    {
        if (!params.app.config.company.workperiod_recovery_by_approver) {
            return Promise.resolve(null);
        }

        const request  = this;
        return request.createRecoveryRight()
        .then(right => {
            if (null === right || undefined === right) {
                return Promise.resolve(null);
            }

            // link right to user using a beneficiary
            return right.addUserBeneficiary(user);
        });
    };

    /**
     * Open a validity interval
     */
    requestSchema.methods.openValidInterval = function()
    {
        this.validInterval.push({
            start: new Date(),
            finish: null
        });
    };


    /**
     * Close the current validity interval
     */
    requestSchema.methods.closeValidInterval = function()
    {
        var last = this.validInterval[this.validInterval.length -1];

        if (null !== last.finish) {
            throw new Error('No open interval found');
        }

        last.finish = new Date();
    };


    /**
     * Update document when an approval step has been accepted
     * @param {ApprovalStep} approvalStep
     * @param {User} user
     * @param {String} comment
     *
     * @return {Int}   Return the remaining approver on the step
     */
    requestSchema.methods.accept = function accept(approvalStep, user, comment) {

        if (!approvalStep.isApprover(user)) {
            throw new Error('User not allowed to accept this approval step');
        }

        // update approval step

        this.addLog('wf_accept', user, comment, approvalStep);

        if ('AND' === approvalStep.operator) {
            var remain = this.getRemainingApprovers(approvalStep);
            if (0 !== remain.length) {
                return remain.length;
            }
        }

        approvalStep.status = 'accepted';


        var nextStep = this.getNextApprovalStep();

        if (null === nextStep) {
            throw new Error('Nothing to accept');
        }

        if (false === nextStep || approvalStep._id === nextStep._id) {
            this.addLog('wf_end', user);

            if ('waiting' === this.status.created) {
                this.status.created = 'accepted';
                this.openValidInterval();
            }

            if ('waiting' === this.status.deleted) {
                this.status.deleted = 'accepted';
                this.addLog('delete', user, null, approvalStep);
                this.closeValidInterval();
            }

            // the workflow sheme has ended, remove approval steps list
            this.approvalSteps = [];


            return 0;
        }

        // add log entry
        this.forwardApproval(nextStep);

        return 0;
    };


    /**
     * Update document when an approval step has been rejected
     * @param {ApprovalStep} approvalStep
     * @param {User} user
     * @param {String} comment
     */
    requestSchema.methods.reject = function reject(approvalStep, user, comment) {

        if (!approvalStep.isApprover(user)) {
            throw new Error('User not allowed to accept this approval step');
        }

        approvalStep.status = 'rejected';

         // add log entry
         this.addLog('wf_reject', user, comment, approvalStep);

        if ('waiting' === this.status.created) {
            this.status.created = 'rejected';
        }

        if ('waiting' === this.status.deleted) {
            this.status.deleted = 'rejected';
        }

        // the workflow sheme has ended, remove approval steps list
        this.approvalSteps = [];
    };


    /**
     * Set status for all events associated to the request
     * @param {String} status   TENTATIVE | CONFIRMED | CANCELLED
     * @return {Promise}
     */
    requestSchema.methods.setEventsStatus = function setEventsStatus(status) {



        if (undefined === this.populated('events')) {
            throw new Error('The events path shoud be populated on request');
        }

        var promises = [];

        for(var i=0; i< this.events.length; i++) {
            this.events[i].status = status;
            promises.push(this.events[i].save());
        }

        return Promise.all(promises);
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


    /**
     * Delete invalid elements
     * @returns {Promise} the list of deleted elements
     */
    requestSchema.methods.deleteElements = function() {
        let list = [];
        this.absence.distribution.forEach(element => {
            if (undefined !== element._id) {
                list.push(element._id);
            } else {
                list.push(element);
            }
        });

        let AbsenceElem = this.model('AbsenceElem');

        return AbsenceElem.find({ _id: { $in: list }}).exec()
        .then(elements => {
            return Promise.all(
                elements.map(element => {
                    return element.remove();
                })
            );
        });
    };

    /**
     * Utility method to populate fileds in all elements of the request
     * elements must be already populated
     *
     * @return Promise
     */
    requestSchema.methods.populateAbsenceElements = function() {
        let request = this;

        return Promise.all(
            request.absence.distribution.map(element => {
                return element.populate('events').execPopulate();
            })
        );
    };


    requestSchema.set('autoIndex', params.autoIndex);

    params.db.model('Request', requestSchema);
};
