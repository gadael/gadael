'use strict';

exports = module.exports = function(params) {
	
	var mongoose = params.mongoose;
	
    var requestSchema = new mongoose.Schema({
    user: { // owner
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true }
    },

    timeCreated: { type: Date, default: Date.now },

    createdBy: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true }
    },

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
        user_right: { type: mongoose.Schema.Types.ObjectId, ref: 'Right' },
        timeCreated: { type: Date, default: Date.now }
    },

    deleted: { type: Boolean, default: false },

    approvalSteps: [params.embeddedSchemas.ApprovalStep],			// on request creation, approval steps are copied and contain references to users
                                                                    // informations about approval are stored in requestLog sub-documents instead

    requestLog: [params.embeddedSchemas.RequestLog]					// linear representation of all actions
                                                                    // create, edit, delete, and effectives approval steps
    });


    requestSchema.pre('validate', function(next) {

      var elem, request = this;


      if (request.absence.rightCollection === undefined) {
          for (var i=0; i<request.absence.distribution.length; i++) {
              elem = request.absence.distribution[i];
              elem.consumedQuantity = elem.quantity;
          }

          next();
          return;
      }


      var collectionModel = this.model('RightCollection');

      collectionModel.findOne({ _id: request.absence.rightCollection }).exec(function (err, rightCollection) {

          for (var i=0; i<request.absence.distribution.length; i++) {
              elem = request.absence.distribution[i];
              elem.consumedQuantity = rightCollection.getConsumedQuantity(elem.quantity);
          }

          next();
      });
    });


    /**
     * Get last request log inserted for the approval workflow
     * @return {RequestLog}
     */
    requestSchema.methods.getlastApprovalRequestLog = function() {
        for(var i=this.requestLog.length; i>=0; i--) {
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

        for(var i=0; i<this.approvalSteps.length; i++) {
            if (this.approvalSteps[i]._id !== last._id) {
                continue;
            }
        }

        if (this.approvalSteps[i+1] === undefined) {
            return false;
        }

        return this.approvalSteps[i+1];
    };



    /**
     * If last approval step is confirmed, notify the appliquant
     * otherwise notify the next manager using approvalsteps
     * @param {ApprovalStep} nextStep
     */
    requestSchema.methods.forwardApproval = function(nextStep) {



        // TODO send message to managers of the nextStep
    };



    /**
     * @param {ApprovalStep} approvalStep
     * @param {User} user
     * @param {String} comment
     */
    requestSchema.methods.accept = function(approvalStep, user, comment) {

        var nextStep = this.getNextApprovalStep();

        if (null === nextStep) {
            throw new Error('Nothing to accept');
        }

        this.addLog('wf_accept', comment, approvalStep);

        if (false === nextStep) {
            this.addLog('wf_end');
            // TODO notify appliquant
            return;
        }

        // add log entry
        this.addLog('wf_accept', comment, approvalStep);
        this.forwardApproval(nextStep);
    };

    /**
     * @param {ApprovalStep} approvalStep
     * @param {User} user
     * @param {String} comment
     */
    requestSchema.methods.reject = function(approvalStep, user, comment) {
         // add log entry
         this.addLog('wf_reject', comment, approvalStep);
    };


    /**
    * Add a log document to request
    * @param {String} action
    * @param {String} comment
    * @param {ApprovalStep} approvalStep
    *
    */
    requestSchema.methods.addLog = function(action, comment, approvalStep) {
        var requestLogModel = this.model('RequestLog');
        var log = new requestLogModel();

        log.action = action;
        log.comment = comment;

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
