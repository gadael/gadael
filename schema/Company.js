'use strict';

exports = module.exports = function(params) {
	var companySchema = new params.mongoose.Schema({
		name: { type: String, required: true, unique: true },			// company name, site title
		port: { type: Number, required: true },							// server port
		lastname: String,												// system owner
		firstname: String,												// system owner
		email: String,													// system owner email, fallback
		managerName: String,											// Manager name used in the from field for notifications and in signature
		managerEmail: String,											// system email, used in from field for notifications
        public_text: String,                                            // Text to display one homepage for annonymous
        private_text: String,                                           // Text to display one homepage for users logged in
        country: { type: String, maxlength: 2, minlength: 2 },          // Country code used for database initialisation ISO 3166-1 alpha-2

		workperiod_recover_request: { type: Boolean, default: false },	// allow creation of workperiod recover requests
		maintenance:  { type: Boolean, default: false },				// maintenance mode, the app is read only
		disabled:  { type: Boolean, default: false },					// Application disabled, no access
		approb_alert: { type: Number, default: 15 },					// number of days after no action on request approbation

		renewal: {														// default renewal date for each year
			day: { type: Number, default: 1 },
			month: { type: Number, default: 1 }
		},

        max_users: Number,                                              // max number of active users

        manager_options: {
            edit_request: { type: Boolean, default: true }              // spoof the users members of departments below him
        },
		timeCreated: { type: Date, default: Date.now },
		lastLogin: Date
	});

	companySchema.index({ name: 1 });

	companySchema.set('autoIndex', params.autoIndex);


    /**
     * Pre-save hook
     * @param {function} next   Callback
     */
    companySchema.pre('save', function(next) {

        if (undefined !== this.max_users) {
            return this.disableForbiddenUsers(next);
        }

        next();
    });




    companySchema.methods.disableForbiddenUsers = function(next) {

        let company = this;
        let userModel = params.db.models.User;

        userModel.find()
            .where('isActive', true)
            .sort('-timeCreated')
            .exec()
            .then(users => {

            let limit = users.length - company.max_users;

            for (let i=0; i<limit; i++) {
                users[i].isActive = false;
                users[i].save();
            }

            next();

        }).catch(next);
    };



	params.db.model('Company', companySchema);
};
