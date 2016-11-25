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
		lastLogin: Date,												// Updated on each login
		lastMinRefresh: Date,											// This is updated every five minutes only


		loginservices: { 												// local or ldap, google

			local: {
				enable: { type: Boolean, default: true }
			},

	        google: {
				enable: { type: Boolean, default: false },				// configure google oAuth login in instance
	            clientID: String,
	            clientSecret: String
	        },

			ldap: {
				enable: { type: Boolean, default: false },				// Authenticate on ldap server
				host: String,
				basedn: String
			}
	    }
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

	/**
	 * Get inactivity in minutes and days
	 * Minutes can be used if days=0
	 * @return Number
	 */
	companySchema.methods.getInactivity = function() {
		let company = this;

		if (!company.lastMinRefresh) {
			return {
				days: 0,
				minutes: 0
			};
		}

		function treatAsUTC(date) {
			let result = new Date(date);
			result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
			return result;
		}

		function daysBetween(startDate, endDate) {
			let millisecondsPerDay = 24 * 60 * 60 * 1000;
			return (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
		}

		let now = new Date();

		// 5 minutes are added to last record to include to potential
		// uncounted refreshs
		let min = 5 + (company.lastMinRefresh.getTime()/60000);

		return {
			days: Math.floor(daysBetween(company.lastMinRefresh, now)),
			minutes: Math.floor((now.getTime()/60000)-min)
		};
	};


	/**
	 * Test if a login form (email or nickname/password) must be displayed
	 * @return {Boolean}
	 */
	companySchema.methods.haveFormLogin = function() {
		return (this.loginservices.local.enable || this.loginservices.ldap.enable);
	};

	/**
	 * Test if the google login button must be displayed
	 * @return {Boolean}
	 */
	companySchema.methods.haveGoogleLogin = function() {
		return this.loginservices.google.enable;
	};


	params.db.model('Company', companySchema);
};
