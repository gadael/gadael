'use strict';

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
		roles: {
		  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
		  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
		  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager' }
		},
		department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
		isActive: { type:Boolean, default:true },
		timeCreated: { type: Date, default: Date.now },
		resetPasswordToken: String,
		resetPasswordExpires: Date,
		twitter: {},
		github: {},
		facebook: {},
		google: {},
		tumblr: {}
	});
  
  
    userSchema.path('email').validate(function (value) {
	   var emailRegex = /^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/;
	   return emailRegex.test(value);
	}, 'The e-mail field cannot be empty.');
  
    /**
     * Get user name
     * @return {String}
     */
    userSchema.methods.getName = function() {
        return this.lastname+' '+this.firstname;
    };

    
    /**
     * Get the department and ancestors 
     * @return {Promise}

    userSchema.methods.getDepartments = function() {
        
        var Q = require('q');
        var deferred = Q.defer();
        var stack = [];
        
        var addToStack = function(err, department) {
            if (err) {
                deferred.reject(new Error(err));
                return;
            }
            
            if (null === department.populated('parent')) {
                deferred.resolve(stack);
                return;
            }
            
            stack.push(department.parent);
            
            department.parent.populate('parent', addToStack);
            
            
        };
        
        this.populate('department', function(err, user) {
            
            if (null === user.populated('department')) {
                // no department on user
                deferred.resolve([]);
                return;
            }
            
            var department = user.department;
            stack.push(department);
            
            addToStack(null, department);
        });
        
        return deferred.promise;
    };
    */


    /**
     * Get an array of departments ancestors, including the user department on the last position of the array
     * if the user have no department, promise resolve to an empty array
     * @return {Promise}
     */
    userSchema.methods.getDepartmentsAncestors = function() {

        var Q = require('q');

        if (!this.department) {
            return Q.fcall(function () {
                return [];
            });
        }

        var deferred = Q.defer();

        this.populate('department', function(err, user) {

            if (err) {
                return deferred.reject(err);
            }


            var department = user.department;

            if (!department) {
                return deferred.resolve([]);
            }

            department.getAncestors(function(err, ancestors) {



                if (err) {
                    return deferred.reject(err);
                }

                ancestors.push(department);
                deferred.resolve(ancestors);
            });

        });


        return deferred.promise;
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

        var Q = require('q');
        var manager = this.roles.manager;

        if (!manager) {
            return Q.fcall(function () {
                return false;
            });
        }

        if (manager.constructor.name !== 'model') {
            return Q.fcall(function () {
                throw new Error("Missing a populated manager document");
            });
        }

        if (!manager.department) {
            return Q.fcall(function () {
                return false;
            });
        }

        var deferred = Q.defer();
        var i, j;

        user.getDepartmentsAncestors().then(function(arr) {
            for(i=0; i<manager.department.length; i++) {
                for(j=0; j<arr.length; j++) {
                    if (manager.department[i].toString() === arr[j]._id.toString()) {
                        deferred.resolve(true);
                    }
                }
            }

            deferred.resolve(false);
        }).catch(deferred.reject);


        return deferred.promise;
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

        var Q = require('q');
        var deferred = Q.defer();

        if (this.roles.admin) {
            deferred.resolve(true);
            return deferred.promise;
        }

        if (!this.roles.manager) {
            // User is not manager
            deferred.resolve(false);
            return deferred.promise;
        }

        this.populate('roles.manager', function(err, populatedUserDoc) {

            populatedUserDoc.isManagerOf(user).then(function(status) {
                if (!status) {
                    return deferred.resolve(false);
                }

                params.db.models.Company.findOne().select('manager_options').exec(function(err, company) {

                    if (err) {
                        return deferred.reject(err);
                    }

                    if (null === company) {
                        return deferred.reject('No company found!');
                    }

                    if (null === company.manager_options) {
                        // if not set get the default value on the schema
                        var fields = params.db.models.Company.schema.paths;
                        return deferred.resolve(fields['manager_options.edit_request'].options.default);
                    }

                    deferred.resolve(company.manager_options.edit_request);
                });

            }).catch(deferred.reject);
        });




        return deferred.promise;
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
     */
    userSchema.methods.saveAdmin = function(callback) {
        
        this.save(function(err, user) {

            if (err || user.roles.admin) {
                callback(err, user);
                return;
            }
            
            var adminModel = params.db.models.Admin;
            
            var admin = new adminModel();
            admin.user = {
                id: user._id,
                name: user.lastname+' '+user.firstname
            };
            
            admin.save(function(err, role) {
                
                if (err) {
                    callback(err, user);
                    return;
                }
                
                user.roles.admin = role._id;
                user.save(callback);
            });
        
        });
    };
    
    

    /**
     * Save user and create account role if necessary
     * @return {Promise}
     */
    userSchema.methods.saveAccount = function(accountProperties) {

        var Q = require('q');
        var deferred = Q.defer();

        this.save(function(err, user) {

            if (err) {
                deferred.reject(err);
                return;
            }

            if (user.roles.account) {
                deferred.reject('Account allready exists');
                return;
            }

            var accountModel = params.db.models.Account;

            var account = new accountModel();
            account.user = {
                id: user._id,
                name: user.lastname+' '+user.firstname
            };

            /*
            for(var prop in accountProperties) {
                if (accountProperties.isOwnProperty(prop)) {
                    account[prop] = accountProperties[prop];
                }
            }
            */
            account.set(accountProperties);

            account.save(function(err, role) {

                if (err) {
                    deferred.reject(err);
                    return;
                }

                user.roles.account = role._id;
                deferred.resolve(user.save());
            });

        });

        return deferred.promise;
    };






    /**
     * Save user and create account role if necessary
     * @return {Promise}
     */
    userSchema.methods.saveManager = function(managerProperties) {

        var Q = require('q');
        var deferred = Q.defer();

        this.save(function(err, user) {

            if (err) {
                deferred.reject(err);
                return;
            }

            if (user.roles.manager) {
                deferred.reject('Manager allready exists');
                return;
            }

            var managerModel = params.db.models.Manager;

            var manager = new managerModel();
            manager.user = {
                id: user._id,
                name: user.lastname+' '+user.firstname
            };

            /*
            for(var prop in managerProperties) {
                if (managerProperties.isOwnProperty(prop)) {
                    manager[prop] = managerProperties[prop];
                }
            }
            */

            manager.set(managerProperties);

            manager.save(function(err, role) {

                if (err) {
                    deferred.reject(err);
                    return;
                }

                user.roles.manager = role._id;
                deferred.resolve(user.save());
            });

        });

        return deferred.promise;
    };













  
  
    /**
     * Encrypt password
     * @param {String} password     clear text password
     * @param {function} done       callback function, receive error and hash as parameter
     */ 
    userSchema.statics.encryptPassword = function(password, done) {
        var bcrypt = require('bcrypt');
        bcrypt.genSalt(10, function(err, salt) {
            if (err) {
                return done(err);
            }

            bcrypt.hash(password, salt, done);
        });
    };
  
  
    /**
     * Validate password
     * @param {String} password     clear text password
     * @param {String} hash         The encrypted password as in database
     * @param {function} done       callback function
     */  
    userSchema.statics.validatePassword = function(password, hash, done) {
        var bcrypt = require('bcrypt');
        bcrypt.compare(password, hash, done);
    };
  
  
  
    /**
     * test method to create random user
     *
     * @param {String} password     clear text password
     * @param {function} done       callback function
     */  
    userSchema.statics.createRandom = function(password, done) {
		
		var Charlatan = require('charlatan');
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
     * Get the associated accountCollection
     *
     * @param {Date} moment         optional parameter
     * @return {Promise}
     */
    userSchema.methods.getAccountCollection = function(moment) {

		if (undefined === moment) {
            moment = new Date();
        }

        var Q = require('q');
        var deferred = Q.defer();

        params.db.models.AccountCollection.findOne()
        .where('account', this.roles.account)
        .where('from').lte(moment)
        .or([{ to: null }, { to: { $gte: moment } }])
        .populate('rightCollection')
        .exec(function (err, accountCollection) {

            if (err) {
                return deferred.reject(err);
            }

            deferred.resolve(accountCollection);
        });

        return deferred.promise;
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
