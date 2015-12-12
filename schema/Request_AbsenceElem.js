'use strict';


/**
 *
 */  
exports = module.exports = function(params) {
	var mongoose = params.mongoose;
	var absenceElemSchema = new mongoose.Schema({
        quantity: { type: Number, required: true },         // quantity equal du duration of period in the planning
        consumedQuantity: { type: Number, required: true }, // quantity removed from vacation right according to attendance percentage from RightCollection
        events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CalendarEvent' }],
        
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
	 * @return {Promise} Mongoose promise
	 */ 
	absenceElemSchema.methods.next = function (callback) {
		// TODO
	};






	absenceElemSchema.set('autoIndex', params.autoIndex);

	params.db.model('AbsenceElem', absenceElemSchema);
};
