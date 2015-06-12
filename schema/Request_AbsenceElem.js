'use strict';


/**
 *
 */  
exports = module.exports = function(params) {
	var mongoose = params.mongoose;
	var absenceElemSchema = new mongoose.Schema({
        quantity: { type: Number },                 // quantity equal du duration of period in the planning
        consumedQuantity: { type: Number },         // quantity removed from vacation right according to attendance percentage from RightCollection
        event: { type: mongoose.Schema.Types.ObjectId, ref: 'CalendarEvent', required: true },
        
        user: {                                     // absence owner
          id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          name: { type: String, required: true }
        },
        
        right: {                                    // right parameters used on absence creation
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'Right', required: true },
            name: { type: String, required: true },
            quantity_unit: { type: String, enum:['D', 'H'], required: true },
            type: { 
                id: { type: mongoose.Schema.Types.ObjectId, ref: 'Type', required: true },
                name: { type: String, required: true },
                color: { type: String }
            },
            renewal: { 
                id: { type: mongoose.Schema.Types.ObjectId, ref: 'RightRenewal' , required: true },
                start: { type: Date, required: true },
                finish: { type: Date, required: true }
            }
		}
	});


	/**
	 * Find next absence element in same request or null if this element is the last
	 * 
	 */ 
	absenceElemSchema.methods.next = function (callback) {
		return this.model('AbsenceElem')
		//	.populate('event')
			.find({ absence: this.absence })
			.where('event.dtstart').gte(this.event.dtstart)
			.limit(1)
			.sort('event.dtstart')
			.exec(callback);
	};


    /**
     * @return {Promise}
     */
    absenceElemSchema.methods.getAccountRight = function()
    {
        var Q = require('q');
        var deferred = Q.defer();
        var renewal = this.right.renewal;
        var userModel = this.model('User');

        if (!renewal) {
            throw new Error('Missing renewal on absence element');
        }

        userModel
            .findOne({ _id: this.user.id })
            .populate('roles.account')
            .exec(function(err, user) {

            if (err) {
                return deferred.reject(err);
            }

            deferred.resolve(user.roles.account.getAccountRight(renewal));
        });

        return deferred.promise;
    };



	absenceElemSchema.set('autoIndex', params.autoIndex);

	params.db.model('AbsenceElem', absenceElemSchema);


};
