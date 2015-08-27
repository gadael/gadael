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
        var renewal = this;

        model.find({ rightRenewal: renewal._id, user: user._id }, 'quantity', function (err, docs) {
            
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
     * Get the right linked to the renewal
     * return a promise and resolve to a Right document
     *
     * @return {Promise}
     */
    rightRenewalSchema.methods.getRightPromise = function() {
        var Q = require('q');
        var deferred = Q.defer();
        var renewal = this;
        
        if (renewal.right && renewal.right._id) {
            // allready populated
            Q.fcall(function () {
                return renewal.right;
            });
        } else if (!renewal.right) {
            
            // No right, should not happen, a renewal must be linked to a right
            Q.fcall(function () {
                return null;
            });
        } else {
            
            renewal.populate('right', function(err, renewal) {
                if (err) {
                    return deferred.reject(err);
                }
                
                deferred.resolve(renewal.right);
            });   
        }
        
        return deferred.promise;
    };
    
    
    
    /**
     * Get a user initial quantity 
     * default right quantity + adjustments on renewal
     * The default quantity from right is accessible only after the account arrival date
     * for renewals straddling the arrival date, the quantiy is computed using the percentage of account valid time
     *
     * @todo duplicated with accountRight object
     * 
     * @param {User} user
     * 
     * @returns {Promise} resolve to a number
     */
    rightRenewalSchema.methods.getUserQuantity = function(user) {
        
        var renewal = this;
        var Q = require('q');
        var deferred = Q.defer();
        
        Q.all([renewal.getRightPromise(), renewal.getUserAdjustmentQuantity(user)])
            .then(function(arr) {

                /**
                 * Default right quantity available for the renewal
                 * if the user account arrival date is > renewal.start
                 * a pro rata of the quantity is computed for the default quantity
                 * @var {Number}
                 */
                var rightQuantity = arr[0].quantity;

                /**
                 * @var {Number}
                 */
                var userAdjustment = arr[1];

                if (user.roles.account.arrival > renewal.finish) {
                    // this will not be used via the REST API because invalid renewal are disacarded before
                    return deferred.resolve(0);
                }


                if (user.roles.account.arrival > renewal.start) {
                    var renewalDuration = renewal.finish.getTime() - renewal.start.getTime();
                    var availableDuration = renewal.finish.getTime() - user.roles.account.arrival.getTime();

                    rightQuantity = Math.round(rightQuantity * availableDuration / renewalDuration);
                }


                deferred.resolve(rightQuantity + userAdjustment);
            })
            .catch(deferred.reject);
            
        return deferred.promise;
    };
    
    
    /**
     * Get a user consumed quantity 
     * sum of quantities in requests from this renewal
     * @todo duplicated with accountRight object
     * 
     * @param {User} user
     * 
     * @returns {Number} resolve to a number
     */
    rightRenewalSchema.methods.getUserConsumedQuantity = function(user) {
        var deferred = require('q').defer();
        var model = this.model('AbsenceElem');
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
     *
     * @todo duplicated with accountRight object
     *
     * @param {User} user
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
    
    
    params.db.model('RightRenewal', rightRenewalSchema);
    
    
    
};


