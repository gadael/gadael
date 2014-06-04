'use strict';

exports = module.exports = function(app, mongoose) {
	var companySchema = new mongoose.Schema({
		name: { type: String, default: '' },							// company name, site title
		workperiod_recover_request: { type: Boolean, default: false },	// allow creation of workperiod recover requests
		maintenance:  { type: Boolean, default: false },				// maintenance mode, the app is read only
		approb_alert: { type: Number },									// number of days after no action on request approbation
		renewal: {														// default renewal date for each year
			day: { type: Number, default: 1 },
			month: { type: Number, default: 1 }
		},
		timeCreated: { type: Date, default: Date.now }
	});

	companySchema.index({ name: 1 });
	
	companySchema.set('autoIndex', (app.get('env') === 'development'));
  
	app.db.model('Department', companySchema);
};
