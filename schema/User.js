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
   *
   */ 
  userSchema.statics.encryptPassword = function(password, done) {
    var bcrypt = require('bcrypt');
    bcrypt.genSalt(10, function(err, salt) {
      if (err) {
        return done(err);
      }

      bcrypt.hash(password, salt, function(err, hash) {
        done(err, hash);
      });
    });
  };
  
  
  /**
   *
   */  
  userSchema.statics.validatePassword = function(password, hash, done) {
    var bcrypt = require('bcrypt');
    bcrypt.compare(password, hash, function(err, res) {
      done(err, res);
    });
  };
  
  
  
  /**
   * test method to create random user
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
  
  
  
  userSchema.index({ email: 1 }, { unique: true });
  userSchema.index({ timeCreated: 1 });
  userSchema.index({ 'twitter.id': 1 });
  userSchema.index({ 'github.id': 1 });
  userSchema.index({ 'facebook.id': 1 });
  userSchema.index({ 'google.id': 1 });
  userSchema.set('autoIndex', params.autoIndex);
  
  params.db.model('User', userSchema);
};
