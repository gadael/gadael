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
