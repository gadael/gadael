'use strict';

exports = module.exports = function(params) {
	var mongoose = params.mongoose;
	var acSchema = new mongoose.Schema({
		account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
		rightCollection: { type: mongoose.Schema.Types.ObjectId, ref: 'RightCollection' , required: true },
		from: { type: Date, required: true },		// Do not modify if in the past
		to: { type: Date },							// Do not modify if in the past
		timeCreated: { type: Date, default: Date.now }
	});
  
	acSchema.set('autoIndex', params.autoIndex);
  
	acSchema.index({ account: 1 });
	acSchema.index({account: 1, rightCollection: 1, from: 1}, {unique: true});
	
	
	params.db.model('AccountCollection', acSchema);
	
	
	
	
	acSchema.pre('save', function (next) {
		
		var accountCollection = this;
		
		if (null !== accountCollection.to && accountCollection.to <= accountCollection.from) {
			next(new Error('Collection end date must be greater than the start date'));
			return;
		}
        
        
        var testOverlap = function(period1, period2) {

            if (period2.to && period1.to) {
                if (period1.to > period2.from && period1.from < period2.to) {
                    // the current period overlap one of the existing periods
                    console.log(period1._id+' '+period2._id);
                    return false;
                }
                return true;
            }
            
            
            if (!period2.to && period1.to > period2.from) {
                // the current infinite period overlap one of the existing periods
                return false;
            }
            
            
            if (!period1.to && period1.from < period2.to) {
                // the current period overlap the end infinite period
                return false;
            }
            
            return true;
        };
        
		
		// verify that the new period start date is greater than all other dates
		var model = params.db.models.AccountCollection;
		model.find({ account: this.account }).sort('from').exec(function(err, acEntries) {
			
			for(var i=0; i < acEntries.length; i++) {
				
				if (acEntries[i].to === null && i !== acEntries.length) {
					next(new Error('All collections except the last must have a end date'));
					return;
				}
                
                if (acEntries[i].to === null && i === acEntries.length && accountCollection._id !== acEntries[i]._id) {
					next(new Error('To add a new collection period, all other collections must have a end date'));
					return;
				}
                
                if (!accountCollection._id.equals(acEntries[i]._id) && !testOverlap(acEntries[i], accountCollection)) {
                    next(new Error('The collection period must begin after the previous collection end date'));
                    return;
                }
                
			}
			
			next();
		});
	});
};

