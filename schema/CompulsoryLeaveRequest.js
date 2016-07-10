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

        request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },

        quantity: Number,   // the duration quantity of the request in the same unit of compulsoryLeave.right.quantity_unit

        user: {             // request owner
            name: { type:String, required: true },
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }
	});


    /**
     * Test if a request can be created for the user beetween the two dates
     * This method will resolve to TRUE if there are no absence or non-working days in the
     * compulsory leave period and if the available quantity for the user allow the request creation
     *
     * @param {CompulsoryLeave} compulsoryLeave
     * @return {Promise}
     */
    compulsoryLeaveRequestSchema.methods.canCreateRequest = function(compulsoryLeave) {


	};

    /**
     * Create the request and set request and quantity field
     * @param {CompulsoryLeave} compulsoryLeave Parent document
     * @return {Promise}
     */
    compulsoryLeaveRequestSchema.methods.createRequest = function(compulsoryLeave) {
        let clr = this;

        return clr.canCreateRequest()
        .then(canCreate => {
            if (!canCreate) {
                return false;
            }

            // TODO: create the request
            return true;
        });
    };


	compulsoryLeaveRequestSchema.set('autoIndex', params.autoIndex);

    params.embeddedSchemas.CompulsoryLeaveRequest = compulsoryLeaveRequestSchema;
};
