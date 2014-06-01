'use strict';

exports = module.exports = function(app, mongoose) {
  var userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    email: { type: String, unique: true },
    roles: {
      admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
      account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
      manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager' }
    },
    isActive: String,
    timeCreated: { type: Date, default: Date.now },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    twitter: {},
    github: {},
    facebook: {},
    google: {},
    tumblr: {},
    search: [String]
  });
  
  
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
  
  
  // userSchema.plugin(require('./plugins/pagedFind'));
  userSchema.index({ username: 1 }, { unique: true });
  userSchema.index({ email: 1 }, { unique: true });
  userSchema.index({ timeCreated: 1 });
  userSchema.index({ 'twitter.id': 1 });
  userSchema.index({ 'github.id': 1 });
  userSchema.index({ 'facebook.id': 1 });
  userSchema.index({ 'google.id': 1 });
  userSchema.index({ search: 1 });
  userSchema.set('autoIndex', (app.get('env') === 'development'));
  
  app.db.model('User', userSchema);
};
