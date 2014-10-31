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
     * Get the right collection for a specific date
     * @return {Promise} resolve to a rightCollection document or null
     */
    accountSchema.methods.getCollection = function(moment) {
        var Q = require('q');
        var deferred = Q.defer();
        

        moment.setHours(0,0,0,0);
        
        this.getAccountCollectionQuery()
            .where('from').lte(moment)
            .where('to').gte(moment)
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
    }

    /**
     * Get the ongoing right collection
     * @return {Promise} resolve to a rightCollection document or null
     */
    accountSchema.methods.getCurrentCollection = function() {
        var today = new Date();
        return this.getCollection(today);
    };
    
    
    /**
     * 
     * Get the list of rights beneficiaries associated to an account
     * @param {Date} moment  optional date parameter
     * 
     * @return {Promise} resolve to an array of beneficiary documents
     */
    accountSchema.methods.getRightBeneficiaries = function(moment) {
        
        var deferred = require('q').defer();
        
        if (null === moment) {
            moment = new Date();
        }
        
        this.getCollection(moment).then(function(rightCollection) {
            this.model('Beneficiary')
            .where('document').in([rightCollection._id, this.user._id])
            .populate('right')
            .exec(function(err, beneficiaries) {
                if (err) {
                    deferred.reject(err);
                }
                
                deferred.resolve(beneficiaries);
            })
        });
        
        return deferred.promise;
    }
    
    /**
     * 
     * @param {Date} moment  optional date parameter
     * @return {Promise} resolve to an array of rights
     */
    accountSchema.methods.getRights = function(moment) {
        
        var deferred = require('q').defer();
        
        this.getRightBeneficiaries(moment).then(function(beneficiaries) {
            
            var rights = [];
            
            for(var i=0; i< beneficiaries.length; i++) {
                rights.push(beneficiaries[i].right);
            }
            
            deferred.resolve(rights);
        }).catch(deferred.reject);
        
        return deferred.promise;
    }
    
    params.db.model('Account', accountSchema);
};
