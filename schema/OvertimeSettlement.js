'use strict';

exports = module.exports = function(params) {
	const mongoose = params.mongoose;

	var overtimeSettlementSchema = new mongoose.Schema({
		comment: { type: String, default: '' },							// Admin comment
		userCreated: {
		  id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		  name: { type: String, default: '' }
		},
		timeCreated: { type: Date, default: Date.now },
        quantity: { type: Number, required: true },
        right: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'Right' },
            name: String
        }
	});

    /**
     * Create recovery right from request
     * Return the overtime conversion to save in account
     * @return {Promise}
     */
    overtimeSettlementSchema.methods.createRecoveryRight = function createRecoveryRight(startDate) {

        const settlement = this;

        /**
         * @param {apiService   service
         * @param {Object} wrParams
         * @return {Promise}
         */
        function createRight()
        {
            const rightModel = settlement.model('Right');
            const right = new rightModel();
            right.name = settlement.right.name;
            right.type = '5740adf51cf1a569643cc50a';
            right.quantity = settlement.quantity;
            right.quantity_unit = 'H';
            right.rules = [{
                title: 'Active for request dates in the renewal period',
                type: 'request_period'
            }];

            return right.save();
        }

        if (undefined === settlement.right) {
            return Promise.resolve(settlement);
        }

        return createRight()
        .then(right => {
            if (null === right) {
                return settlement;
            }
            settlement.right.id = right._id;
            return right.createovertimeSettlementRenewal({ start: startDate })
            .then(renewal => {
                if (undefined === renewal._id) {
                    throw new Error('The new renewal ID is required');
                }
                return settlement;
            });
        });

    };

	overtimeSettlementSchema.set('autoIndex', params.autoIndex);
    params.embeddedSchemas.overtimeSettlement = overtimeSettlementSchema;
};
