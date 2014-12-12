'use strict';

exports = module.exports = function(params) {
	
	var mongoose = params.mongoose;

	var rightRenewalSchema = new mongoose.Schema({
        
        right: { type: mongoose.Schema.Types.ObjectId, ref: 'Right', required: true },
        timeCreated: { type: Date, default: Date.now },
        lastUpdate: { type: Date, default: Date.now },
        start: { type: Date, required: true },
        finish: { type: Date, required: true }
	});
  
	rightRenewalSchema.set('autoIndex', params.autoIndex);
  
	params.db.model('RightRenewal', rightRenewalSchema);
    
    
    
    /**
     * Ensure that the renewal interval do not overlap another renewal period
     */
    rightRenewalSchema.pre('save', function (next) {
		
		var renewal = this;
        
        var model = params.db.models.AccountCollection;
		model.find({ right: renewal.right })
            .where('start').lt(renewal.finish)
            .where('finish').gt(renewal.start)
            .count(function(err, renewals) {
                if (err) {
                    next(err);
                    return;   
                }
            
                if (renewals > 0) {
                    next('The renewals periods must not overlap');
                    return;
                }
            }
        );
        
        next();
        
	});
    
    
    
    /**
     * Get a user adjustement quantity, can be a negative value
     * adjustments on renewal
     * 
     * @param {Document} user
     * 
     * @returns {Promise} resolve to a number
     */
    rightRenewalSchema.methods.getUserAdjustmentQuantity = function(user) {
        var deferred = require('q').defer();
        var model = params.db.models.Adjustment;
        model.find({ rightRenewal: this._id, user: user._id }, 'quantity', function (err, docs) {
            
            if (err) {
                deferred.reject(err);
            }
            
            var adjustments = 0;
            for(var i=0; i<docs.length; i++) {
                adjustments += docs[i].quantity;
            }
            
            deferred.resolve(adjustments);
        });
        
        return deferred.promise;
    };
    
    
    
    /**
     * Get a user initial quantity 
     * default right quantity + adjustments on renewal
     * 
     * @param {Document} user
     * 
     * @returns {Promise} resolve to a number
     */
    rightRenewalSchema.methods.getUserQuantity = function(user) {
        
        var Q = require('q');
        var deferred = Q.defer();
        var populate = Q.denodeify(this.populate);
        Q.all([populate('right'), this.getUserAdjustmentQuantity()])
            .then(function(arr) {
                deferred.resolve(arr[0].quantity + arr[1]);
            })
            .catch(deferred.reject);
            
        return deferred.promise;
    };
    
    
    /**
     * Get a user consumed quantity 
     * sum of quantities in requests from this renewal
     * 
     * @param {Document} user
     * 
     * @returns {Number} resolve to a number
     */
    rightRenewalSchema.methods.getUserConsumedQuantity = function(user) {
        var deferred = require('q').defer();
        var model = params.db.models.AbsenceElem;
        model.find({ 'right.renewal.id': this._id, 'user.id': user._id }, 'quantity', function (err, docs) {
            if (err) {
                deferred.reject(err);
            }
            
            var consumed = 0;
            for(var i=0; i<docs.length; i++) {
                consumed += docs[i].quantity;
            }
            
            deferred.resolve(consumed);
        });
        
        return deferred.promise;
    };
        
    
    /**
     * Get a user available quantity 
     * the user quantity - the consumed quantity
     * @returns {Promise} resolve to a number
     */
    rightRenewalSchema.methods.getUserAvailableQuantity = function(user) {
        
        var Q = require('q');
        var deferred = Q.defer();
        Q.all([this.getUserQuantity(user), this.getUserConsumedQuantity(user)]).then(function(arr) {
            deferred.resolve(arr[0] - arr[1]);
        }).catch(deferred.reject);
        
        return deferred.promise;
    };
    
};


