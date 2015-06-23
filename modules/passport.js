'use strict';

exports = module.exports = function(app, passport) {

  passport.db = app.db;
  var LocalStrategy = require('passport-local').Strategy,
      GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;


  passport.use(new LocalStrategy(
    function(username, password, done) {

      var db = passport.db;

      var conditions = { 
		  isActive: true,
		  email: username
	  };

      db.models.User.findOne(conditions)
        .exec(function(err, user) {
        if (err) {
          return done(err);
        }

        if (!user) {
          return done(null, false, { message: 'Unknown user' });
        }

        db.models.User.validatePassword(password, user.password, function(err, isValid) {
          if (err) {
            return done(err);
          }

          if (!isValid) {
            return done(null, false, { message: 'Invalid password' });
          }

          return done(null, user);
        });
      });
    }
  ));



  if (app.config.oauth.google.key) {
    passport.use(new GoogleStrategy({
        clientID: app.config.oauth.google.key,
        clientSecret: app.config.oauth.google.secret
      },
      function(accessToken, refreshToken, profile, done) {
        done(null, false, {
          accessToken: accessToken,
          refreshToken: refreshToken,
          profile: profile
        });
      }
    ));
  }


  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {

    var db = passport.db;
    db.models.User.findOne({ _id: id })
        .populate('department')
        .populate('roles.admin')
        .populate('roles.account').exec(function(err, user) {
      if (user && user.roles && user.roles.admin) {
        user.roles.admin.populate("groups", function(err, admin) {
          done(err, user);
        });
      }
      else {

          if (null === user) {
            console.trace(id+' -> NULL');
          }
        done(err, user);
      }
    });
  });
  
  
  var http = require('http'), req = http.IncomingMessage.prototype;
  
	/**
	 * Test if logged in
	 * output a 401 unauthorized header on failure
	 */ 
	req.ensureAuthenticated = function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }

        var workflow = req.app.utility.workflow(req, res);
        var gt = req.app.utility.gettext;
        
        workflow.httpstatus = 401;
        workflow.emit('exception', gt.gettext('Access denied for anonymous users'));
	};




	/**
	 * Test if logged in as administrator
	 * output a 401 unauthorized header on failure
	 */ 
	req.ensureAdmin = function(req, res, next) {
        
        
        
	  if (req.isAuthenticated() && req.user.canPlayRoleOf('admin')) {
		return next(req, res);
	  }
      
      var workflow = req.app.utility.workflow(req, res);
      var gt = req.app.utility.gettext;
      
      workflow.httpstatus = 401;
      workflow.emit('exception', gt.gettext('Access denied for non administrators'));
	};


	/**
	 * Test if logged in as user a verified user account
	 * output a 401 unauthorized header on failure
	 */  
	req.ensureAccount = function(req, res, next) {

        var denyAccess = function() {
            
            var workflow = req.app.utility.workflow(req, res);
            var gt = req.app.utility.gettext;
            
            workflow.httpstatus = 401;
            workflow.emit('exception', gt.gettext('Access denied'));
        };
        
        if (req.user.canPlayRoleOf('account')) {
            if (req.app.config.requireAccountVerification) {
                if (req.user.roles.account.isVerified !== 'yes') {
                    return denyAccess();
                }
            }
            return next(req, res);
        }
        
        return denyAccess();
	};

  
};
