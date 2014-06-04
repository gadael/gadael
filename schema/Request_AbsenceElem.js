'use strict';


/**
 *
 */  
exports = module.exports = function(app, mongoose) {
	var absenceElemSchema = new mongoose.Schema({
	absence: { type: mongoose.Schema.Types.ObjectId, ref: 'Absence', required: true },
	quantity: { type: Number },
	event: { type: mongoose.Schema.Types.ObjectId, ref: 'CalendarEvent', required: true },
	right: {
			id: { type: mongoose.Schema.Types.ObjectId, ref: 'Right' },
			name: { type: String, default: '' },
			quantity_unit: { type: String, enum:['D', 'H'] },
			type: { 
				id: { type: mongoose.Schema.Types.ObjectId, ref: 'Type' },
				name: { type: String },
				color: { type: String }
			}
		}
	});
  
	absenceElemSchema.set('autoIndex', (app.get('env') === 'development'));
  
	app.db.model('AbsenceElem', absenceElemSchema);
  

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
