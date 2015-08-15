'use strict';


/**
 * Right rules embeded into right document
 */
exports = module.exports = function(params) {
	
	var mongoose = params.mongoose;
    
    var ruleTypes = [
        'entry_date',       // right is visible when the entry date is in the interval
                            // min in days before the renewal start date
                            // max in days after the renewal end date

        'request_date',     // right is visible when request begin date >= computed min date
                            // and request end date <= computed max date
                            // min in days before the renewal start date
                            // max in days after the renewal end date

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
            min: { type: Number, default: 0 }, // number of days or number of years
            max: { type: Number, default: 0 }  // number of days or number of years
        },
        
        timeCreated: { type: Date, default: Date.now },
        lastUpdate: { type: Date, default: Date.now }
	});
  

    
    
    
    /**
     * Ensure that the interval is valid for the selected rule type
     * interval must have one value set
     * if the two values are set min must be < max
     */
    rightRuleSchema.pre('save', function (next) {
		
        var Gettext = require('node-gettext');
        var gt = new Gettext();
		var rule = this;
        
        if (undefined === rule.interval || (undefined === rule.interval.min && undefined === rule.interval.max)) {
            next(new Error('At least one value must be set in interval to save the rule'));
            return;
        }
        
        var min = (undefined === rule.interval.min) ? null : rule.interval.min;
        var max = (undefined === rule.interval.max) ? null : rule.interval.max;
        
        
		
		switch(rule.type) {
            case 'seniority':
                console.log(typeof min);
                console.log(typeof max);
                if (isNaN(min) || isNaN(max)) {
                    next(new Error(gt.gettext('Interval values must be numbers of years')));
                    return;
                }

                if (min < max) {
                    next(new Error(gt.gettext('Interval values must be set in a correct order')));
                    return;
                }
                
            break;
            
            case 'entry_date':
            case 'request_date':
                // no possible verification
                
            break;
        }
        
        
        
        
        next();
        
	});



    rightRuleSchema.set('autoIndex', params.autoIndex);

	params.embeddedSchemas.RightRule = rightRuleSchema;
};


