'use strict';

exports = module.exports = function(params) {
	var companySchema = new params.mongoose.Schema({
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
	
	companySchema.set('autoIndex', params.autoIndex);
  
	params.db.model('Company', companySchema);
};
