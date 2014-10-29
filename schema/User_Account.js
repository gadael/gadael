'use strict';

/**
 * Account is a user with a collection or rights
 * registrations on site create accounts
 */
exports = module.exports = function(params) {

    var mongoose = params.mongoose;

    var accountSchema = new mongoose.Schema({
        user: {
          id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          name: { type: String, default: '' }
        },
        isVerified: { type: String, default: '' },				// email verification on change
        verificationToken: { type: String, default: '' },		// email verification on change

        status: {
          id: { type: String, ref: 'Status' },
          name: { type: String, default: '' },
          userCreated: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            name: { type: String, default: '' },
            time: { type: Date, default: Date.now }
          }
        },
        statusLog: [mongoose.modelSchemas.StatusLog],

        // start date for seniority vacation rights
        seniority: Date,

        userCreated: {											// the user who create this account
          id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          name: { type: String, default: '' }
        },

        notify: {
            approvals: { type: Boolean, default: false },
            allocations: { type: Boolean, default: false }
        }
    });

    accountSchema.index({ user: 1 });
    accountSchema.index({ 'status.id': 1 });
    accountSchema.set('autoIndex', params.autoIndex);
    
    

    /**
     * Find rights collections
     * @returns {Query} A mongoose query on the account collection schema
     */
    accountSchema.methods.getAccountCollectionQuery = function() {
        return this.model('AccountCollection')
            .find()
            .where('account').equals(this._id);
    };

    /**
     * Get the ongoing right collection
     * @return {Promise}
     */
    accountSchema.methods.getCurrentCollection = function() {
        var Q = require('q');
        var deferred = Q.defer();
        
        this.getAccountCollectionQuery()
            .where('from').lte(Date.now())
            .where('to').gte(Date.now())
            .populate('rightCollection')
            .exec(function(err, arr) {
            
                if (err) {
                    deferred.reject(err);
                    return;
                }
            
                if (!arr || 0 === arr.length) {
                    deferred.resolve(null);
                    return;   
                }
            
                deferred.resolve(arr[0].rightCollection);
            });
        
        return deferred.promise;
    };
    
    params.db.model('Account', accountSchema);
};
