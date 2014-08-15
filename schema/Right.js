'use strict';

exports = module.exports = function(params) {
    
    var mongoose = params.mongoose;
    
	var rightSchema = new params.mongoose.Schema({
		name: { type: String, unique: true },
        description: String,
		timeCreated: { type: Date, default: Date.now },
        type: { type: mongoose.Schema.Types.ObjectId, ref: 'Type' },
        require_approval: { type: Boolean, default:true },
        sortkey: Number,
        
        // automatic distribution on this right on request creation
        autoDistribution: { type: Boolean, default:true },
        
        quantity: { type: Number, min:0 },
        quantity_unit: { type: String, enum:['D', 'H'] },
        
        increment: {
            monthQuantity: { type: Number, min:0 },
            max: { type: Number, min:0 },
            last: Date
        },
        
        activeFor: {
            account: { type: Boolean, default:true },
            
            // manager substituting one of his subordinate
            manager: { type: Boolean, default:true },
            
            // admin substituting one of the user with vacation account
            admin: { type: Boolean, default:true }
        },
        
        // right is usable if one of the following rules
        // is verified
        rules: [mongoose.modelSchemas.rightRule],
        
        // activeSpan.min minimal number of days between entry date and request start date
        // this is the time given to the approvers
        // activeSpan.max maximal number of days between entry date and request end date
        // by default, the parameter is set globally
        activeSpan: {
            useDefault: { type: Boolean, default:true },
            min: Number,
            max: Number
        }
	});

	rightSchema.index({ 'name': 1 }, { unique: true });
	rightSchema.set('autoIndex', params.autoIndex);

	params.db.model('Right', rightSchema);
};
