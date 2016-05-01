'use strict';

exports = module.exports = function(params) {
	var companySchema = new params.mongoose.Schema({
		name: { type: String, required: true, unique: true },			// company name, site title
		port: { type: Number, required: true },							// server port

		workperiod_recover_request: { type: Boolean, default: false },	// allow creation of workperiod recover requests
		maintenance:  { type: Boolean, default: false },				// maintenance mode, the app is read only
		approb_alert: { type: Number },									// number of days after no action on request approbation

		renewal: {														// default renewal date for each year
			day: { type: Number, default: 1 },
			month: { type: Number, default: 1 }
		},

        max_users: Number,                                              // max number of active users

        manager_options: {
            edit_request: { type: Boolean, default: true }              // spoof the users members of departments below him
        },
		timeCreated: { type: Date, default: Date.now }
	});

	companySchema.index({ name: 1 });
	
	companySchema.set('autoIndex', params.autoIndex);
  
	params.db.model('Company', companySchema);
};
