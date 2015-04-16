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
     * Get the department and ancestors 
     * @return {Promise}
     */
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
    
    
    /**
     * Test if the user can act on behalf of another user
     * @this User
     *
     * @param {User}
     * @return {Boolean}
     */
    userSchema.methods.canSpoofUser = function(user) {
        if (this.roles.admin) {
            return true;
        }

        // TODO: fix department test (can be populated)
        // TODO: allow for sub-departments?
        if (this.roles.manager && this.roles.manager.department === user.department) {
            return true;
        }

        return false;
    };



    /**
     * Get an array of departments ancestors
     * @return {Promise}
     */
    userSchema.methods.getDepartmentsAncestors = function() {

        var Q = require('q');
        var deferred = Q.defer();
        var user = this;
        var ancestors = [];

        function loop(err, dep) {
            if (!dep || err) {
                return deferred.resolve(ancestors);
            }

            dep.populate('parent', loop);
        }

        this.populate('department', function() {

            var department = user.department;

            //TODO fix this infinite loop

            //if (!department) {
                return deferred.resolve(ancestors);
            //}

            //loop(null, department);
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
		
		var Charlatan = require('../node_modules/charlatan/lib/charlatan.js');
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
