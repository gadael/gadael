'use strict';

exports = module.exports = function(params) {
	var mongoose = params.mongoose;
	var acSchema = new mongoose.Schema({
		account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
		calendar: { type: mongoose.Schema.Types.ObjectId, ref: 'Calendar' , required: true },
		from: { type: Date, required: true },		// Do not modify if in the past
		to: { type: Date },							// Do not modify if in the past
		timeCreated: { type: Date, default: Date.now }
	});
  
	acSchema.set('autoIndex', params.autoIndex);
  
	acSchema.index({ account: 1 });
	acSchema.index({account: 1, calendar: 1, from: 1}, {unique: true});
	
	
	params.db.model('AccountScheduleCalendar', acSchema);
	
	
	
	
	acSchema.pre('save', function (next) {
		
		var accountSheduleCalendar = this;
		
		if (null !== accountSheduleCalendar.to && accountSheduleCalendar.to <= accountSheduleCalendar.from) {
			next(new Error('Schedule calendar end date must be greater than the start date'));
			return;
		}
        
        var testOverlap = require('../models/testoverlap');
		
		// verify that the new period start date is greater than all other dates
		var model = params.db.models.AccountSheduleCalendar;
		model.find({ account: this.account }).sort('from').exec(function(err, acEntries) {
			
			for(var i=0; i < acEntries.length; i++) {
				
				if (acEntries[i].to === null && i !== acEntries.length) {
					next(new Error('All schedule calendars except the last must have a end date'));
					return;
				}
                
                if (acEntries[i].to === null && i === acEntries.length && accountSheduleCalendar._id !== acEntries[i]._id) {
					next(new Error('To add a new schedule period, all other scheduled calendars must have a end date'));
					return;
				}
                
                if (!accountSheduleCalendar._id.equals(acEntries[i]._id) && !testOverlap(acEntries[i], accountSheduleCalendar)) {
                    next(new Error('The schedule period must begin after the previous schedule period end date'));
                    return;
                }
                
			}
			
			next();
		});
	});
};

