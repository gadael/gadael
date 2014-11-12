'use strict';

exports = module.exports = function(params) {
	
	var mongoose = params.mongoose;
    
    var ruleTypes = [
        'entry_date',       // right is visible when the entry date is in
                            // the interval
        'request_date',     // right is visible when request date is in the interval
        'seniority'         // Right si visible if the user account seniority date
                            // is in the interval, min and max are in years before
                            // the entry date
    ];

	
	var rightRuleSchema = new mongoose.Schema({
        
        right: { type: mongoose.Schema.Types.ObjectId, ref: 'Right', required: true },
        
        // title displayed to the user as a condition
        // to apply this vacation right
		title: { type: String, required: true },
        
        // quantity to add to the right
        // when this rule is verified
        quantity: Number,
        
        type: { type: String, enum: ruleTypes, required: true },
        
        interval: {
            min: mongoose.Schema.Types.Mixed,    // Date or Number
            max: mongoose.Schema.Types.Mixed     // Date or Number
        },
        
        timeCreated: { type: Date, default: Date.now },
        lastUpdate: { type: Date, default: Date.now }
	});
  
	rightRuleSchema.set('autoIndex', params.autoIndex);
  
	params.db.model('RightRule', rightRuleSchema);
    
    
    
    /**
     * Ensure that the interval is valid for the selected rule type
     * interval must have one value set
     * if the two values are set min must be < max
     */
    rightRuleSchema.pre('save', function (next) {
		
		var rule = this;
        
        if (undefined === rule.interval || (undefined === rule.interval.min && undefined === rule.interval.max)) {
            next(new Error('At least one value must be set in interval to save the rule'));
            return;
        }
        
        var min = (undefined === rule.interval.min) ? null : rule.interval.min;
        var max = (undefined === rule.interval.max) ? null : rule.interval.max;
        
        
		
		switch(rule.type) {
            case 'seniority':
            if ((min && !(min instanceof Number)) || (max && !(max instanceof Number))) {
                next(new Error('Interval values must be numbers of years'));
                return;
            }
            break;
            
            case 'entry_date':
            case 'request_date':
            if ((min && !(min instanceof Date)) || (max && !(max instanceof Date))) {
                next(new Error('Interval values must be dates'));
                return;
            }
            break;
        }
        
        
        if (min > max) {
            next(new Error('Interval values must be set in a correct order'));
            return;
        }
        
        next();
        
	});
};


