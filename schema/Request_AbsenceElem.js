'use strict';


/**
 *
 */  
exports = module.exports = function(params) {
	var mongoose = params.mongoose;
	var absenceElemSchema = new mongoose.Schema({
        absence: { type: mongoose.Schema.Types.ObjectId, ref: 'Absence', required: true },
        quantity: { type: Number },
        event: { type: mongoose.Schema.Types.ObjectId, ref: 'CalendarEvent', required: true },
        right: {
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
  
	absenceElemSchema.set('autoIndex', params.autoIndex);
  
	params.db.model('AbsenceElem', absenceElemSchema);
  

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
};
