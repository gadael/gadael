'use strict';


/**
 *
 */  
exports = module.exports = function(params) {
	var mongoose = params.mongoose;
	var absenceElemSchema = new mongoose.Schema({
        quantity: { type: Number, required: true },         // quantity equal du duration of period in the planning
        consumedQuantity: { type: Number, required: true }, // quantity removed from vacation right according to Right.consuption
                                                            // consuption=proportion: attendance percentage from RightCollection
                                                            // consuption=businessDays: businessDays from RightCollection
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
     * Pre-save hook
     *
     */
    absenceElemSchema.pre('validate', function(next) {

        let err;

        if (!this.events || this.events.length === 0) {
            err = new Error('Invalid event list on absence element');
            return next(err);
        }

        if (this.quantity <= 0) {
            err = new Error('Invalid duration quantity on absence element');
            return next(err);
        }

        if (this.consumedQuantity <= 0) {
            err = new Error('Invalid consuption on absence element');
            return next(err);
        }

        next();
    });


	/**
	 * Find next absence element in same request or null if this element is the last
	 * @return {Promise} Mongoose promise
	 */ 
	absenceElemSchema.methods.next = function(callback) {
		// TODO
	};


    /**
     * Get an array with one date per leave day
     * @return {array}
     */
    absenceElemSchema.methods.getLeaveDays = function() {

        let dtstart = this.events[0].dtstart;
        let dtend = this.events[this.events.length-1].dtend;

        let days = [];

        let loop = new Date(dtstart);
        loop.setHours(0,0,0,0);

        while (loop < dtend) {
            days.push(new Date(loop));
            loop.setDate(loop.getDate() + 1);
        }

        return days;
	};


    /**
     * Get additional deducted quantity for part-time collections
     * this method get the number of days in base business days witch are not in applicant business days
     *
     * @param {Array}  baseBusinessDays       List of business days for a 100% attendance
     * @param {Array}  appliquantBusinessDays List of business days of the request appliquant
     *
     * @return {Number} Number of days
     */
    absenceElemSchema.methods.getAdditionalDeductedQuantity = function(baseBusinessDays, appliquantBusinessDays) {

        let days = this.getLeaveDays();
        let d, total = 0;

        for (var i=0; i<days.length; i++) {
            d = days[i].getDay();
            if (-1 !== baseBusinessDays.indexOf(d)) {
                if (-1 === appliquantBusinessDays.indexOf(d)) {
                    total += 1;
                }
            }
        }

        return total;
    };



	absenceElemSchema.set('autoIndex', params.autoIndex);

	params.db.model('AbsenceElem', absenceElemSchema);
};
