'use strict';

exports = module.exports = function(params) {
    
    var mongoose = params.mongoose;
    
    var beneficiarySchema = new params.mongoose.Schema({
        right: { type: mongoose.Schema.Types.ObjectId, ref: 'Right', required: true },
        
        // right can be linked to a collection or to a user
        document: { type: mongoose.Schema.Types.ObjectId, required: true },
        
        ref: { type: String, enum: ['User', 'RightCollection'], required: true },
        timeCreated: { type: Date, default: Date.now }
    });

    /**
     * Get the list users of the beneficiary document
     * @return {Promise} resolve to an array of users
     */
    beneficiarySchema.methods.getUsers = function() {
        
        var deferred = require('q').defer();
        var ref = this.ref;
        
        this.model(this.ref).findOne(this.document, function(err, document) {
            if (err) {
                deferred.reject(err);
                return;
            }

            if ('User' === ref) {
                deferred.resolve([document]);
            }
            
            if ('RightCollection' === ref) {
                deferred.resolve(document.getUsers());
            }
        });
        
        return deferred.promise;
    };
    


    beneficiarySchema.set('autoIndex', params.autoIndex);
    beneficiarySchema.index({ name: 1 });
    beneficiarySchema.index({ right: 1, document: 1 }, { unique: true });
    params.db.model('Beneficiary', beneficiarySchema);
};
