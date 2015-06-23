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
        distribution: [mongoose.modelSchemas.AbsenceElem]
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

    approvalSteps: [mongoose.modelSchemas.ApprovalStep],			// on request creation, approval steps are copied and contain references to users
                                                                    // informations about approval are stored in requestLog sub-documents instead

    requestLog: [mongoose.modelSchemas.RequestLog],					// linear representation of all actions
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



    requestSchema.pre('save', function(next) {
        // TODO: create approval steps

        next();
    });


    /**
    * Create approval steps if not exists on request
    * @param {Function} next
    */
    requestSchema.methods.createApprovalSteps = function(next) {
        if (this.approvalSteps.length > 0) {
            return next();
        }

        var stepModel = this.model('ApprovalStep');
        var userModel = this.model('User');


        function createStep(approvers) {
            var step = new stepModel();
            step.operator = 'AND';
            step.approvers = approvers;
            step.save();
        }

        // get departments hierarchy for the owner of the request

        userModel.findOne({ _id: this.user.id }, function(err, user) {
            if (err) {
                return next(err);
            }

            user.getDepartments().then(function(arr) {
                for(var i=0; i<arr.length; i++) {
                    arr[i].getManagers(createStep);
                }
            });
        });

        //
    };


    /**
    * Add a log document to request
    * @param {String} action
    * @param {String} comment
    *
    * @return {Promise} the mongoose promise
    */
    requestSchema.methods.addLog = function(action, comment) {
      var requestLogModel = this.model('RequestLog');
      var log = new requestLogModel();

      log.action = action;
      log.comment = comment;
      return log.save();
    };



    requestSchema.index({ 'user.id': 1 });
    requestSchema.set('autoIndex', params.autoIndex);

    params.db.model('Request', requestSchema);
};
