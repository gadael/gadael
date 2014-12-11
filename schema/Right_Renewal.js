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
     * Get a user initial quantity 
     * default right quantity + adjustments on renewal
     * @returns {Number}
     */
    rightRenewalSchema.methods.getUserQuantity = function(user) {
        
    };
    
    
    /**
     * Get a user consumed quantity 
     * sum of quantities in requests from this renewal
     * @returns {Number}
     */
    rightRenewalSchema.methods.getUserConsumedQuantity = function(user) {
        
    };
        
    
    /**
     * Get a user available quantity 
     * the user quantity - the consumed quantity
     * @returns {Number}
     */
    rightRenewalSchema.methods.getUserAvailableQuantity = function(user) {
        return this.getUserQuantity(user) - this.getUserConsumedQuantity(user);
    };
    
};


