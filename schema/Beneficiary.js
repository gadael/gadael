'use strict';

exports = module.exports = function(params) {

    var mongoose = params.mongoose;

    var beneficiarySchema = new params.mongoose.Schema({
        right: { type: mongoose.Schema.Types.ObjectId, ref: 'Right', required: true },

        // right can be linked to a collection or to a user
        document: { type: mongoose.Schema.Types.ObjectId, required: true },

        // "User" can be used only with rights not linked to a collection
        // "RightCollection" can be used only with rights not linked to a user
        // beneficiary with ref=User is used for recovery rights created after
        // validation of a recovery request
        ref: { type: String, enum: ['User', 'RightCollection'], required: true, index: true },
        timeCreated: { type: Date, default: Date.now },

        from: { type: Date  },		// Availability of the right if ref=User
		to: { type: Date },			// the period will be ignored for rights associated to collection
                                    // the period of the collection is used instead
    });

    /**
     * Populate document
     * @return {Promise}
     */
    beneficiarySchema.methods.populateDocument = function() {
        let beneficiary = this;

        return beneficiary.populate({
            path: 'document',
            model: beneficiary.ref
        }).execPopulate();
    };

    /**
     * @return {Promise}
     */
    beneficiarySchema.methods.getDocument = function() {
        return this.populateDocument()
        .then(beneficiary => beneficiary.document);
    };


    /**
     * Get users linked to beneficiary
     * Resolve to array
     * @param {Date} moment optional date
     * @return {Promise}
     */
    beneficiarySchema.methods.getUsers = function(moment) {
        let beneficiary = this;
        if ('User' === beneficiary.ref) {
            return beneficiary.populateDocument()
            .then(beneficiary => {
                return [beneficiary.document];
            });
        }

        if ('RightCollection' === beneficiary.ref) {
            return beneficiary.populateDocument()
            .then(beneficiary => {
                let collection = beneficiary.document;
                return collection.getUsers(moment);
            });
        }
    };

    /**
     * Get account collection or null
     * @param {User} user
     * @return {Promise}
     */
    beneficiarySchema.methods.getAccountCollection = function(user) {
        if ('RightCollection' !== this.ref) {
            return Promise.resolve(null);
        }

        return this.getDocument()
        .then(collection => {
            return collection.getAccountCollection(user.getAccountId());
        });
    };



    beneficiarySchema.set('autoIndex', params.autoIndex);
    beneficiarySchema.index({ right: 1, document: 1 }, { unique: true });
    params.db.model('Beneficiary', beneficiarySchema);
};
