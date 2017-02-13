'use strict';


/**
 * A compulsory leave request is embeded in a compulsory leave
 * The document will be created and embeded without the request field
 * it will be used to test the validity of the compulsory leave
 *
 * @param {Object} params
 */
exports = module.exports = function(params) {

	var mongoose = params.mongoose;
	var compulsoryLeaveRequestSchema = new mongoose.Schema({

        request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', index: true },

        quantity: Number,   // the duration quantity of the request in the same unit of compulsoryLeave.right.quantity_unit
                            // using dates only (not the consumed quantity)

        user: {             // request owner
            name: String,
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }
        }
	});




	compulsoryLeaveRequestSchema.set('autoIndex', params.autoIndex);

    params.embeddedSchemas.CompulsoryLeaveRequest = compulsoryLeaveRequestSchema;
};
