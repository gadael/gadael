'use strict';

const daysBetween = require('../modules/daysBetween');


exports = module.exports = function(params) {
	var companySchema = new params.mongoose.Schema({
		name: { type: String, required: true, unique: true },			// company name, site title
		port: { type: Number, default: 3000 },							// server port
		lastname: String,												// system owner
		firstname: String,												// system owner
		email: String,													// system owner email, fallback
		managerName: String,											// Manager name used in the from field for notifications and in signature
		managerEmail: String,											// system email, used in from field for notifications
        public_text: String,                                            // Text to display one homepage for annonymous
        private_text: String,                                           // Text to display one homepage for users logged in
        country: { type: String, maxlength: 2, minlength: 2 },          // Country code used for database initialisation ISO 3166-1 alpha-2

		workperiod_recover_request: { type: Boolean, default: true },	// allow creation of workperiod recover requests
        workperiod_recovery_by_approver: { type: Boolean, default: false },// The approver convert overtime to absence right
                                                                        // If false, the overtime may be converted or settled afterward by the administrator

		maintenance:  { type: Boolean, default: false },				// maintenance mode, the app is read only
		disabled:  { type: Boolean, default: false },					// Application disabled, no access
		approb_alert: { type: Number, default: 15 },					// number of days after no action on request approbation

        max_users: Number,                                              // max number of active users

        manager_options: {
            edit_request: { type: Boolean, default: true }              // spoof the users members of departments below him
        },
		timeCreated: { type: Date, default: Date.now },
		lastLogin: Date,												// Updated on each login
		lastMinRefresh: Date,											// This is updated every five minutes only

		loginservices: { 												// local or ldap, google

			form: {
				enable: { type: Boolean, default: true },
				ldap: {													// TODO
					enable: { type: Boolean, default: false },			// Authenticate on ldap server
					host: String,
					basedn: String,
					filter: String
				}
			},

	        google: {
				enable: { type: Boolean, default: false },				// configure google oAuth login in instance
	            clientID: String,
	            clientSecret: String,
				domain: String											// Accounts will be created on login only if email match with the domain
	        },

			cas: {
				enable: { type: Boolean, default: false },
				ssoBaseURL: String
			},

			header: {													// authenticate with a truster header containing the email
				enable: { type: Boolean, default: false },
				emailHeader: String
			}
	    },

		calendar: {														// user events synchronization with a calendar
			google: {
				enable: { type: Boolean, default: false },
				clientID: String,
	            clientSecret: String
			}
		}
	});

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


	companySchema.post('save', function(company) {
		// Update config cache on each modification
		params.app.config.company = company;
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
	 * @return {object}
	 */
	companySchema.methods.getInactivity = function() {
		let company = this;
		let now = new Date();

		let creationDays = 0;
		if (company.timeCreated) {
			creationDays = Math.floor(daysBetween(company.timeCreated, now));
		}

		const lastViewed = company.lastMinRefresh || company.lastLogin;

		if (!lastViewed) {
			return {
				creationDays: creationDays,
				login: false,
				days: 0,
				minutes: 0
			};
		}

		// 5 minutes are added to last record to include to potential
		// uncounted refreshs
		let min = 5 + (lastViewed.getTime()/60000);

		return {
			creationDays: creationDays,
			login: true,
			days: Math.floor(daysBetween(lastViewed, now)),
			minutes: Math.floor((now.getTime()/60000)-min)
		};
	};



	params.db.model('Company', companySchema);
};
