'use strict';

exports = module.exports = function(app, mongoose) {
	var companySchema = new mongoose.Schema({
		name: { type: String, default: '' },
		workperiod_recover_request: { type: bool, default: false },
		maintenance:  { type: bool, default: false },
		timeCreated: { type: Date, default: Date.now }
	});

	companySchema.index({ name: 1 });
	
	companySchema.set('autoIndex', (app.get('env') === 'development'));
  
	app.db.model('Department', companySchema);
};
