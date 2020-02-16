'use strict';

const bcrypt = require('bcryptjs');
const Charlatan = require('charlatan');
const util = require('util');
const oauthrefresh = require('passport-oauth2-refresh');
const getStrategy = require('./../modules/gcalstrategy');
const gcal = require('google-calendar');

/**
 * a user can be an account, a manager or an administrator
 *
 */
exports = module.exports = function(params) {

	let mongoose = params.mongoose;
	let userSchema = new mongoose.Schema({
		password: { type: String, select: false },
		email: { type: String, required: true, index: true, unique: true },
		lastname: { type: String, required: true },
		firstname: { type: String },
        image: { type:String, select: false }, // avatar base64 url with image content
		roles: {
		  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
		  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
		  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager' }
		},
		department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
		isActive: { type:Boolean, default:true },
		timeCreated: { type: Date, default: Date.now, index: true },

        validInterval: [params.embeddedSchemas.ValidInterval],   // list of dates interval where the user is active

		resetPasswordToken: String,
		resetPasswordExpires: Date,
		google: {
			profile: { type: String, index: true },		// Authentication
            accessToken: String,						// permanent connexion with calendar
            refreshToken: String,
            expire_in: Date,
            calendar: String
        },
		api: {
			clientId: { type: String, index: true, unique: true, sparse: true },
			clientSecret: { type: String, select: false },
			authorizationCode: { type: String, index: true, unique: true, sparse: true },
			authorizationCodeExpiresAt: Date,
			accessToken: { type: String, index: true, unique: true, sparse: true },
			accessTokenExpiresAt: Date,
			refreshToken: { type: String, index: true, unique: true, sparse: true },
			refreshTokenExpiresAt: Date,
			scope: [String]
		}
	});


    /**
     * Pre-save hook
     * @param {function} next   Callback
     */
    userSchema.pre('save', function(next) {

        this.fixValidIntervalOnSave();
        return this.checkMaxActiveUsers(next);
    });




    /**
     * delete documents associated to the user asynchronously
     *
     */
    userSchema.pre('remove', function(next) {

        var models = params.db.models;

        models.Admin.deleteMany({ 'user.id': this._id }).exec();
        models.Account.deleteMany({ 'user.id': this._id }).exec();
        models.Manager.deleteMany({ 'user.id': this._id }).exec();

        next();
    });



    userSchema.path('email').validate(function (value) {
	   var emailRegex = /^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/;
	   return emailRegex.test(value);
	}, 'The e-mail field cannot be empty.');


	userSchema.virtual('imageUrl').get(function() {
	    return './users/'+this._id+'/image';
	});


    /**
     * Get user name
     * @return {String}
     */
    userSchema.methods.getName = function getName() {
        return this.lastname+' '+this.firstname;
    };


    /**
     * Pre save hook to check if the max number of users equal to the number of active users
     * @param {function} next
     */
    userSchema.methods.checkMaxActiveUsers = function(next) {

		const gt = params.app.utility.gettext;

		let user = this;

        let userModel = params.db.models.User;
		let company = params.app.config.company;

        if (null === company || undefined === company.max_users || null === company.max_users) {
            return next();
        }

        userModel.countDocuments()
		.where('isActive', true)
		.ne('_id', user._id)
		.exec(function(err, existingUsers) {

            if (err) {
                return next(err);
            }

            if (user.isActive && company.max_users <= existingUsers) {
                let message = util.format(gt.gettext('The total number of active users cannot exceed %d'), company.max_users);
                return next(new Error(message));
            }

            return next();
        });
    };


    /**
     * Pre-save hook, do not call directly
     * if isActive is modified, create or close a validInterval
     */
    userSchema.methods.fixValidIntervalOnSave = function() {

        let user = this;

        if (!user.isSelected('isActive')) {
            return;
        }


        if (undefined === user.validInterval) {
            user.validInterval = [];
        }

        let last = user.validInterval.length -1;
        let active = (undefined === user.isActive || user.isActive);
        let lastClosed = (undefined === user.validInterval[last] || user.validInterval[last].finish instanceof Date);

        if (active && lastClosed) {
            user.validInterval.push({
                start: new Date(),
                finish: null
            });
            return;
        }


        if (false === user.isActive && !lastClosed) {
            user.validInterval[last].finish = new Date();
        }
    };



	/**
	 * Update auto adjustments for all rights renewals associated to user
	 * @param {Date} moment
	 * @return {Promise}
	 */
	userSchema.methods.updateAutoAdjustments = function(moment) {
		if (!moment) {
            moment = new Date();
        }


		let user = this;

		return user.getAccount()
		.then(account => {
			return account.getMomentRenewals(moment);
		})
		.then(renewals => {

			let promises = [];
			renewals.forEach(renewal => {
				if (null === renewal) {
					console.log('No active renewal on '+moment);
					return;
				}

				promises.push(renewal.updateAutoAdjustments(user));
			});

			return Promise.all(promises);
		});
	};



    /**
     * Get department name if exists
     * @return {String}
     */
    userSchema.methods.getDepartmentName = function() {

        if (!this.department) {
            return '';
        }

        return this.department.name;
    };


    /**
     * Get an array of departments ancestors, including the user department on the last position of the array
     * if the user have no department, promise resolve to an empty array
     * @return {Promise}
     */
    userSchema.methods.getDepartmentsAncestors = function() {

        let userDocument = this;

        return new Promise((resolve, reject) => {

            if (!userDocument.department) {
                return resolve([]);
            }

            userDocument.populate('department', function(err, user) {

                if (err) {
                    return reject(err);
                }


                var department = user.department;

                if (!department) {
                    return resolve([]);
                }

                department.getAncestors()
				.then(function(ancestors) {
                    ancestors.push(department);
                    resolve(ancestors);
                })
				.catch(reject);

            });

        });
    };



    /**
     * Test if the user is manager of another user
     * Promise resolve to a boolean
     * @this {User}
     *
     *
     * @param {User} user   Mongoose user document
     * @return {Promise}
     */
    userSchema.methods.isManagerOf = function(user) {

        let manager = this.roles.manager;

        return new Promise((resolve, reject) => {

            if (!manager) {
                return resolve(false);
            }

            if (manager.constructor.name !== 'model') {
                return reject(new Error("Missing a populated manager document"));
            }

            if (!manager.department) {
                return resolve(false);
            }

            let i, j;

            user.getDepartmentsAncestors().then(function(arr) {
                for(i=0; i<manager.department.length; i++) {
                    for(j=0; j<arr.length; j++) {
                        if (manager.department[i].toString() === arr[j]._id.toString()) {
                            return resolve(true);
                        }
                    }
                }

                resolve(false);
            }).catch(reject);
        });
    };


    /**
     * Test if the user can act on behalf of another user
     * for the request creations.
     * The promise resolve to a boolean
     *
     * @this User
     *
     * @todo test
     *
     * @param {User}    user document with a populated manager role document
     * @return {Promise}
     */
    userSchema.methods.canSpoofUser = function(user) {

        let userDocument = this;

        return new Promise((resolve, reject) => {

            if (this.roles.admin) {
                return resolve(true);
            }

            if (!this.roles.manager) {
                // User is not manager
                return resolve(false);
            }

            userDocument.populate('roles.manager', function(err, populatedUserDoc) {

                if (err) {
                    return reject(err);
                }

                populatedUserDoc.isManagerOf(user).then(function(status) {
                    if (!status) {
                        return resolve(false);
                    }

                    params.db.models.Company.findOne().select('manager_options').exec(function(err, company) {

                        if (err) {
                            return reject(err);
                        }

                        if (null === company) {
                            return reject(new Error('No company found!'));
                        }

                        if (null === company.manager_options) {
                            // if not set get the default value on the schema
                            var fields = params.db.models.Company.schema.paths;
                            return resolve(fields['manager_options.edit_request'].options.default);
                        }

                        resolve(company.manager_options.edit_request);
                    });

                }).catch(reject);
            });




        });
    };






    /**
     * Test role
     * 	admin: administrator of vacations application
     * 	account: regular user, can create vacation requests if rights are availables
     * 	manager: department(s) manager, can supervise one or more departments
     *
     * @param	string	role
     *
     * @return bool
     */
    userSchema.methods.canPlayRoleOf = function(role) {

        if (role === "admin" && this.roles.admin) {
            return true;
        }

        if (role === "account" && this.roles.account) {
            return true;
        }

        if (role === "manager" && this.roles.manager) {
            return true;
        }

        return false;
    };


    /**
     * Default return URL after login
     */
    userSchema.methods.defaultReturnUrl = function() {
        var returnUrl = '/';

        if (this.canPlayRoleOf('admin')) {
            // TODO
            return returnUrl;
        }

        if (this.canPlayRoleOf('manager')) {
            // TODO
            return returnUrl;
        }

        return returnUrl;
    };




    /**
     * Save user and create admin role if necessary
     * @return {Promise}
     */
    userSchema.methods.saveAdmin = function(adminProperties) {

        let userDocument = this;

        return new Promise((resolve, reject) => {

            userDocument.save(function(err, user) {

                if (err) {
                    return reject(err);
                }

                if (user.roles.admin) {
                    return reject(new Error('Admin already exists'));
                }

                var adminModel = params.db.models.Admin;

                var admin = new adminModel();
                admin.user = {
                    id: user._id,
                    name: user.lastname+' '+user.firstname
                };


                if (undefined !== adminProperties) {
                    admin.set(adminProperties);
                }

                admin.save(function(err, role) {

                    if (err) {
                        return reject(err);
                    }

                    user.roles.admin = role._id;
                    resolve(user.save());
                });

            });

        });
    };



    /**
     * Save user and create account role if necessary
     * @return {Promise}
     */
    userSchema.methods.saveAccount = function(accountProperties) {

        let userDocument = this;

        return new Promise((resolve, reject) => {

            userDocument.save((err, user) => {

                if (err) {
                    return reject(err);
                }

                if (user.roles.account) {
                    return reject(new Error('Account already exists on user document'));
                }

                let accountModel = params.db.models.Account;

                let account = new accountModel();
                account.user = {
                    id: user._id,
                    name: user.lastname+' '+user.firstname
                };


                if (undefined !== accountProperties) {
                    account.set(accountProperties);
                }

                account.save(function(err, role) {

                    if (err) {
                        return reject(err);
                    }

                    user.roles.account = role._id;
                    resolve(user.save());
                });

            });

        });
    };






    /**
     * Save user and create account role if necessary
     * @return {Promise}
     */
    userSchema.methods.saveManager = function(managerProperties) {

        let userDocument = this;

        return new Promise((resolve, reject) => {

            userDocument.save(function(err, user) {

                if (err) {
                    return reject(err);
                }

                if (user.roles.manager) {
                    return reject(new Error('Manager already exists'));
                }

                var managerModel = params.db.models.Manager;

                var manager = new managerModel();
                manager.user = {
                    id: user._id,
                    name: user.lastname+' '+user.firstname
                };


                if (undefined !== managerProperties) {
                    manager.set(managerProperties);
                }

                manager.save(function(err, role) {

                    if (err) {
                        return reject(err);
                    }

                    user.roles.manager = role._id;
                    resolve(user.save());
                });

            });

        });
    };





    /**
     * Find users on a specific moment
     * @param {Date} moment
     * @return {Query}
     */
    userSchema.statics.getMomentUsersFind = function(moment) {
        let findUsers = this.find();

        findUsers.where('validInterval.start').lt(moment);
        findUsers.or([
            {
                'validInterval.finish': { $gt: moment }
            },
            {
                'validInterval.finish': null
            }
        ]);

        return findUsers;
    };










    /**
     * Encrypt password
     * @param {String} password     clear text password
     *
     * @return {Promise}
     */
    userSchema.statics.encryptPassword = function(password) {

        return new Promise((resolve, reject) => {

            bcrypt.genSalt(10, function(err, salt) {
                if (err) {
					return reject(err);
                }

                bcrypt.hash(password, salt, (err, hash) => {

                    if (err) {
                        return reject(err);
                    }

                    resolve(hash);
                });
            });

        });

    };


    /**
     * Validate password
     * @param {String} password     clear text password
     * @param {String} hash         The encrypted password as in database
     * @param {function} done       callback function
     */
    userSchema.statics.validatePassword = function(password, hash, done) {
        bcrypt.compare(password, hash, done);
    };



    /**
     * test method to create random user
     *
     * @param {String} password     clear text password
     * @param {function} done       callback function
     */
    userSchema.statics.createRandom = function(password, done) {


		var model = this;

		this.encryptPassword(password)
		.then(function(hash) {

			var fieldsToSet = {
				email: Charlatan.Internet.email(),
				lastname: Charlatan.Name.lastName(),
				firstname: Charlatan.Name.firstName(),
				password: hash
			};

			model.create(fieldsToSet, done);

		})
		.catch(done);
    };

	/**
	 * @return {ObjectId}
	 */
	userSchema.methods.getAccountId = function() {
		let accountId = this.populated('roles.account');
		return (undefined === accountId) ?
			this.roles.account :
			accountId;
	};


    /**
     * get account promise
     * if already populated, promisify the existing document
     * else populate the document or reject the promise is the user is not an account
     *
     *
     * @return {Promise}
     */
    userSchema.methods.getAccount = function() {

        let user = this;

        if (!user.roles.account) {
            throw new Error('Missing account');
        }

        return user.populate('roles.account').execPopulate()
		.then(populatedUser => {
            return populatedUser.roles.account;
        });

    };


	/**
     * get manager promise
     * if already populated, promisify the existing document
     * else populate the document or reject the promise is the user is not a manager
     *
     *
     * @return {Promise}
     */
    userSchema.methods.getManager = function() {

        let user = this;

        if (!user.roles.manager) {
            throw new Error('Not a manager');
        }

        return user.populate('roles.manager').execPopulate().then(populatedUser => {
            return populatedUser.roles.manager;
        });

    };



    /**
     * Get the associated accountCollection
     *
     * @param {Date} moment         optional parameter
     * @return {Promise}
     */
    userSchema.methods.getAccountCollection = function(moment) {

		if (undefined === moment) {
            moment = new Date();
        }

        let userDocument = this;

        return new Promise((resolve, reject) => {

            params.db.models.AccountCollection.findOne()
            .where('account', userDocument.roles.account)
            .where('from').lte(moment)
            .or([{ to: null }, { to: { $gte: moment } }])
            .populate('rightCollection')
            .exec(function (err, accountCollection) {

                if (err) {
                    return reject(err);
                }

                resolve(accountCollection);
            });

        });
    };








    /**
     * Get the associated accountCollections on a period
     * sorted chronologically
     *
     * @param {Date} dtstart    entry start
     * @param {Date} dtend      entry end
     * @param {Date} moment     entry creation date
     * @return {Promise}        Mongoose promise
     */
    userSchema.methods.getEntryAccountCollections = function(dtstart, dtend, moment) {

        var query = params.db.models.AccountCollection.find()
            .where('account', this.roles.account)
            .where('from').lt(dtend)
            .or([
                { to: null },
                { to: { $gt: dtstart } }
            ]);

        if (undefined !== moment) {

            query.where(
                { $and: [
                    { $or: [
                        { createEntriesFrom: null },
                        { createEntriesFrom: { $lte: moment } }
                    ]},
                    { $or: [
                        { createEntriesTo: null },
                        { createEntriesTo: { $gte: moment } }
                    ]}
                ]}
            );

        }

        query
            .populate('rightCollection')
            .sort('from');

        return query.exec();
    };


    /**
     * Get list of collections used on a period and containing a specific right
     *
     *
     *
     * @param   {Date}     dtstart period start
     * @param   {Date}     dtend   period end
     * @param   {Right}    right   mongoose document
     * @returns {Promise} Resolve to an array of RightCollection documents
     */
    userSchema.methods.getCollectionsWithRight = function(dtstart, dtend, right) {
        let user = this;
        let collections = {};


        return user.getEntryAccountCollections(dtstart, dtend)
        .then(accountCollections => {
            let rightsPromises = [];
            accountCollections.forEach(accountCollection => {
                collections[accountCollection.rightCollection.id] = accountCollection.rightCollection;
                rightsPromises.push(accountCollection.rightCollection.getRights());
            });

            return Promise.all(rightsPromises);
        })
        .then(all => {
            let filteredCollections = [];

            all.forEach(beneficiaries => {
                beneficiaries.forEach(b => {
                    if (b.right.id === right.id && 'RightCollection' === b.ref) {
                        filteredCollections.push(collections[b.document.toString()]);
                    }
                });
            });

            return filteredCollections;
        });
    };



    /**
     * Get last 100 messages for the user
     * @return {Promise}
     */
    userSchema.methods.getMessages = function getMessages() {
        var query = params.db.models.Message.find()
            .where('user.id', this._id);

        query
            .limit(100)
            .sort({ 'timeCreated': -1 });

        return query.exec();
    };



    /**
     * @return {Promise}
     */
    userSchema.methods.sendMessage = function sendMessage(subject, body) {
        var model = params.db.models.Message;
        var message = new model();

        message.user = {
            id: this._id,
            name: this.getName()
        };
        message.subject = subject;
        message.body = body;

        return message.save();
    };


    /**
     * Refresh google access token for calendar access
     * The promise resolve to the saved user document
     * @return {Promise}
     */
    userSchema.methods.refreshGoogleAccessToken = function() {
        let user = this;

        return new Promise((resolve, reject) => {

            oauthrefresh.use(getStrategy(params.app.config));

            oauthrefresh.requestNewAccessToken('google', user.google.refreshToken, function(err, accessToken, refreshToken) {

                if (err) {
                    return reject(err);
                }

                if (!accessToken) {
                    return reject(new Error('refresh google access token give no result'));
                }

                user.google.accessToken = accessToken;
                if (refreshToken) {
                    // should be the same of the initial refresh token
                    user.google.refreshToken = refreshToken;
                }
                resolve(user.save());
            });
        });
    };


    /**
     * create a callback function for the google api
     * if the api fail with a 401 status code, the access token is refreshed and a new call to getUserResponse is done
     *
     *
     *
     * @param   {Function} getUserResponse
     * @param   {Function} resolve       function called on success
     * @param   {Function} reject        function called on failure, if token refresh has failed
     * @param   {Function} errorToAlerts function called when errors are produced by the google api
     *
     * @returns {Function} The callback for google api
     */
    userSchema.methods.createGoogleCallback = function(getUserResponse, resolve, reject, errorToAlerts) {

        let retry = 3;
        let user = this;

        if (undefined === errorToAlerts) {
            errorToAlerts = function() {
                // additional errors are ignored for this promise method
            };
        }

        return function googleResponse(err, data) {
            if(err) {

                retry--;
                errorToAlerts(err);

                if (401 === err.code && retry > 0) {


                    // access token token expired, refresh done less than 2 times
                    user.refreshGoogleAccessToken()
                    .then(getUserResponse)
                    .catch(err => {

                        errorToAlerts(err);
                        reject(err);
                    });
                    return;
                }

                return reject(err);
            }


            resolve(data);
        };
    };


    /**
     * Call google api on the calendar linked to the user
     * @param {Function} onReady    This function get as parameter the GoogleCalendar instance and the callback to use on api
     * @return {Promise}
     */
    userSchema.methods.callGoogleCalendarApi = function(onReady) {

        let self = this;

        return new Promise((resolve, reject) => {

            function getUserResponse(user) {

                let googleResponse = user.createGoogleCallback(getUserResponse, resolve, reject);
                let google_calendar = new gcal.GoogleCalendar(user.google.accessToken);

                onReady(google_calendar, googleResponse);
            }

            getUserResponse(self);

        });
    };


	userSchema.methods.initFromGoogle = function(profile) {
		this.google.profile = profile.id;
		this.email = profile.email;
		this.lastname = profile.name.familyName;
		this.firstname = profile.name.givenName;

		if (!this.lastname) {
			// no google+ account
			this.lastname = this.email.split('@')[0];
		}

	};



	/**
	 * Update all stats cache for the user
	 * after a request creation or a custom beneficiary modification
	 *
	 * @param {Date} moment Optional date for modification, if no moment, update all history
	 *
	 * @return {Promise}
	 */
	userSchema.methods.updateRenewalsStat = function(moment) {
		let user = this;

		return user.getAccount()
		.then(account => {
			return account.getBeneficiariesRenewals(moment);
		})
		.then(arr => {


			let promises = [];

			arr.forEach(o => {
				// only way found to ignore error
				// a simple promise map has not worked
				let p = new Promise(resolve => {
					o.renewal.updateUserStat(user, o.beneficiary)
					.then(resolve)
					.catch(() => {
						resolve();
					});
				});

				promises.push(p);
			});

			return Promise.all(promises);
		});
	};

    userSchema.set('autoIndex', params.autoIndex);
	userSchema.set('toJSON', { virtuals: true });
	userSchema.set('toObject', { virtuals: true });

    params.db.model('User', userSchema);

};
