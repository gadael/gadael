'use strict';

let bcrypt = require('bcrypt');
let Charlatan = require('charlatan');
let gt = require('./../modules/gettext');
let util = require('util');

/**
 * a user can be an account, a manager or an administrator
 * 
 */ 
exports = module.exports = function(params) {
	
	var mongoose = params.mongoose;
	var userSchema = new mongoose.Schema({
		password: { type: String, required: true },
		email: { type: String, required: true },
		lastname: { type: String, required: true },
		firstname: { type: String },
        image: String, // avatar base64 url
		roles: {
		  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
		  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
		  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager' }
		},
		department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
		isActive: { type:Boolean, default:true },
		timeCreated: { type: Date, default: Date.now },

        validInterval: [params.embeddedSchemas.ValidInterval],   // list of dates interval where the user is active

		resetPasswordToken: String,
		resetPasswordExpires: Date,
		twitter: {},
		github: {},
		facebook: {},
		google: {},
		tumblr: {}
	});
  

    /**
     * Pre-save hook
     * @param {function} next   Callback
     */
    userSchema.pre('save', function(next) {

        this.fixValidIntervalOnSave();

        if (this.isActive) {
            return this.checkMaxActiveUsers(next);
        }

        next();
    });


    userSchema.path('email').validate(function (value) {
	   var emailRegex = /^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/;
	   return emailRegex.test(value);
	}, 'The e-mail field cannot be empty.');


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

        let companyModel = params.db.models.Company;
        let userModel = params.db.models.User;

        companyModel.findOne().select('max_users').exec(function(err, company) {

            if (err) {
                return next(err);
            }


            if (undefined === company.max_users || null === company.max_users) {
                return next();
            }

            userModel.count().where('isActive', true).exec(function(err, existingUsers) {

                if (err) {
                    return next(err);
                }


                if (company.max_users <= existingUsers) {
                    let message = util.format(gt.gettext('The total number of active users cannot exceed %d'), company.max_users);
                    return next(new Error(message));
                }

                return next();
            });

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

                department.getAncestors(function(err, ancestors) {

                    if (err) {
                        return reject(err);
                    }

                    ancestors.push(department);
                    resolve(ancestors);
                });

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
     * Save user and create account role if necessary
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
                    return reject(new Error('Admin allready exists'));
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
                    return reject(new Error('Account allready exists on user document'));
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
                    return reject(new Error('Manager allready exists'));
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
     * @param {function} [done]       callback function, receive error and hash as parameter
     *
     * @return {Promise}
     */ 
    userSchema.statics.encryptPassword = function(password, done) {

        return new Promise((resolve, reject) => {

            bcrypt.genSalt(10, function(err, salt) {
                if (err) {
                    return done(err);
                }

                bcrypt.hash(password, salt, (err, hash) => {

                    if (undefined !== done) {
                        done(err, hash);
                    }

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

		this.encryptPassword(password, function(err, hash) {

			if (err)
			{
				return done(err);
			}
			
			var fieldsToSet = {
				email: Charlatan.Internet.email(),
				lastname: Charlatan.Name.lastName(),
				firstname: Charlatan.Name.firstName(),
				password: hash
			};
		  
			model.create(fieldsToSet, done);
			
		});
    };


    /**
     * get account promise
     * if allready populated, promisify the existing document
     * else populate the document or reject the promise is the user is not an account
     *
     * TODO create methods for 2 other roles
     *
     * @return {Promise}
     */
    userSchema.methods.getAccount = function() {

        let user = this;

        if (!user.roles.account) {
            throw new Error('Missing account');
        }

        return user.populate('roles.account').execPopulate().then(populatedUser => {
            return populatedUser.roles.account;
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
     * delete documents associated to the user asynchronously
     *
     */
    userSchema.pre('remove', function(next) {
        
        var models = params.db.models;
        
        models.Admin.remove({ 'user.id': this._id }).exec();
        models.Account.remove({ 'user.id': this._id }).exec();
        models.Manager.remove({ 'user.id': this._id }).exec();
        
        next();
    });
  
  
  
    userSchema.index({ email: 1 }, { unique: true });
    userSchema.index({ timeCreated: 1 });
    userSchema.index({ 'twitter.id': 1 });
    userSchema.index({ 'github.id': 1 });
    userSchema.index({ 'facebook.id': 1 });
    userSchema.index({ 'google.id': 1 });
    userSchema.set('autoIndex', params.autoIndex);
  
    params.db.model('User', userSchema);

};
