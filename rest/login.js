'use strict';


/**
 * Authenticate with a post
 */  
exports.authenticate = function(req, res) {
	
	var workflow = req.app.utility.workflow(req, res);

	  workflow.on('validate', function() {

		if (!req.body.username) {
		  workflow.outcome.errfor.username = 'required';
		  workflow.httpstatus = 400; // Bad Request
		}

		if (!req.body.password) {
		  workflow.outcome.errfor.password = 'required';
		  workflow.httpstatus = 400; // Bad Request
		}

		if (workflow.hasErrors()) {
		  return workflow.emit('response');
		}

		workflow.emit('abuseFilter');
	  });

	  workflow.on('abuseFilter', function() {
		var getIpCount = function(done) {
		  var conditions = { ip: req.ip };
		  req.app.db.models.LoginAttempt.count(conditions, function(err, count) {
			if (err) {
			  return done(err);
			}

			done(null, count);
		  });
		};

		var getIpUserCount = function(done) {
		  var conditions = { ip: req.ip, user: req.body.username };
		  req.app.db.models.LoginAttempt.count(conditions, function(err, count) {
			if (err) {
			  return done(err);
			}

			done(null, count);
		  });
		};

		var asyncFinally = function(err, results) {
		  if (err) {
			return workflow.emit('exception', err);
		  }

		  if (results.ip >= req.app.config.loginAttempts.forIp || results.ipUser >= req.app.config.loginAttempts.forIpAndUser) {
			workflow.outcome.errors.push('You\'ve reached the maximum number of login attempts. Please try again later.');
			return workflow.emit('response');
		  }
		  else {
			workflow.emit('attemptLogin');
		  }
		};

		require('async').parallel({ ip: getIpCount, ipUser: getIpUserCount }, asyncFinally);
	  });

	  workflow.on('attemptLogin', function() {
		req._passport.instance.authenticate('local', function(err, user, info) {
		  if (err) {
			return workflow.emit('exception', err);
		  }

		  if (!user) {
			var fieldsToSet = { ip: req.ip, user: req.body.username };
			req.app.db.models.LoginAttempt.create(fieldsToSet, function(err, doc) {
			  if (err) {
				return workflow.emit('exception', err);
			  }

			  workflow.outcome.errors.push('Username and password combination not found or your account is inactive.');
			  return workflow.emit('response');
			});
		  }
		  else {
			req.login(user, function(err) {
			  if (err) {
				return workflow.emit('exception', err);
			  }

			  workflow.emit('response');
			});
		  }
		})(req, res);
	 });

	 workflow.emit('validate');
};




/**
 * Send an email with a reset password link 
 */ 
exports.forgotPassword = function(req, res, next) {
	var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.body.email) {
      workflow.outcome.errfor.email = 'required';
      workflow.httpstatus = 400;
      return workflow.emit('response');
    }

    workflow.emit('generateToken');
  });

  workflow.on('generateToken', function() {
    var crypto = require('crypto');
    crypto.randomBytes(21, function(err, buf) {
      if (err) {
        return next(err);
      }

      var token = buf.toString('hex');
      req.app.db.models.User.encryptPassword(token, function(err, hash) {
        if (err) {
          return next(err);
        }

        workflow.emit('patchUser', token, hash);
      });
    });
  });

  workflow.on('patchUser', function(token, hash) {
    var conditions = { email: req.body.email.toLowerCase() };
    var fieldsToSet = {
		resetPasswordToken: hash,
		resetPasswordExpires: Date.now() + 10000000
    };
    
    
    
    req.app.db.models.User.findOneAndUpdate(conditions, fieldsToSet, function(err, user) {
      if (err) {
		return workflow.emit('exception', err);
      }

      if (!user) {
		var gt = req.app.utility.gettext;
		var util = require('util');
		workflow.outcome.errors.push(util.format(gt.gettext('No user found with email %s'), req.body.email.toLowerCase()));
        return workflow.emit('response');
      }

		
      workflow.emit('sendEmail', token, user);
    });
  });

  workflow.on('sendEmail', function(token, user) {
    req.app.utility.sendmail(req, res, {
      from: req.app.config.smtp.from.name +' <'+ req.app.config.smtp.from.address +'>',
      to: user.email,
      subject: 'Reset your '+ req.app.config.projectName +' password',
      textPath: 'login/forgot/email-text',
      htmlPath: 'login/forgot/email-html',
      locals: {
        username: user.username,
        resetLink: req.protocol +'://'+ req.headers.host +'/login/reset/'+ user.email +'/'+ token +'/',
        projectName: req.app.config.projectName
      },
      success: function(message) {
        workflow.emit('response');
      },
      error: function(err) {
        workflow.outcome.errors.push('Error Sending: '+ err);
        workflow.emit('response');
      }
    });
  });

  workflow.emit('validate');
};





exports.loginTwitter = function(req, res, next){
  req._passport.instance.authenticate('twitter', function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/login/');
    }

    req.app.db.models.User.findOne({ 'twitter.id': info.profile.id }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        res.render('login/index', {
          oauthMessage: 'No users found linked to your Twitter account. You may need to create an account first.',
          oauthTwitter: !!req.app.config.oauth.twitter.key,
          oauthGitHub: !!req.app.config.oauth.github.key,
          oauthFacebook: !!req.app.config.oauth.facebook.key,
          oauthGoogle: !!req.app.config.oauth.google.key,
          oauthTumblr: !!req.app.config.oauth.tumblr.key
        });
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return next(err);
          }

          //res.redirect(getReturnUrl(req));
        });
      }
    });
  })(req, res, next);
};

exports.loginGitHub = function(req, res, next){
  req._passport.instance.authenticate('github', function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/login/');
    }

    req.app.db.models.User.findOne({ 'github.id': info.profile.id }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        res.render('login/index', {
          oauthMessage: 'No users found linked to your GitHub account. You may need to create an account first.',
          oauthTwitter: !!req.app.config.oauth.twitter.key,
          oauthGitHub: !!req.app.config.oauth.github.key,
          oauthFacebook: !!req.app.config.oauth.facebook.key,
          oauthGoogle: !!req.app.config.oauth.google.key,
          oauthTumblr: !!req.app.config.oauth.tumblr.key
        });
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return next(err);
          }

          //res.redirect(getReturnUrl(req));
        });
      }
    });
  })(req, res, next);
};

exports.loginFacebook = function(req, res, next){
  req._passport.instance.authenticate('facebook', { callbackURL: '/login/facebook/callback/' }, function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/login/');
    }

    req.app.db.models.User.findOne({ 'facebook.id': info.profile.id }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        res.render('login/index', {
          oauthMessage: 'No users found linked to your Facebook account. You may need to create an account first.',
          oauthTwitter: !!req.app.config.oauth.twitter.key,
          oauthGitHub: !!req.app.config.oauth.github.key,
          oauthFacebook: !!req.app.config.oauth.facebook.key,
          oauthGoogle: !!req.app.config.oauth.google.key,
          oauthTumblr: !!req.app.config.oauth.tumblr.key
        });
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return next(err);
          }

          //res.redirect(getReturnUrl(req));
        });
      }
    });
  })(req, res, next);
};

exports.loginGoogle = function(req, res, next){
  req._passport.instance.authenticate('google', { callbackURL: '/login/google/callback/' }, function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/login/');
    }

    req.app.db.models.User.findOne({ 'google.id': info.profile.id }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        res.render('login/index', {
          oauthMessage: 'No users found linked to your Google account. You may need to create an account first.',
          oauthTwitter: !!req.app.config.oauth.twitter.key,
          oauthGitHub: !!req.app.config.oauth.github.key,
          oauthFacebook: !!req.app.config.oauth.facebook.key,
          oauthGoogle: !!req.app.config.oauth.google.key,
          oauthTumblr: !!req.app.config.oauth.tumblr.key
        });
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return next(err);
          }

          //res.redirect(getReturnUrl(req));
        });
      }
    });
  })(req, res, next);
};

exports.loginTumblr = function(req, res, next){
  req._passport.instance.authenticate('tumblr', { callbackURL: '/login/tumblr/callback/' }, function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/login/');
    }

    if (!info.profile.hasOwnProperty('id')) {
      info.profile.id = info.profile.username;
    }

    req.app.db.models.User.findOne({ 'tumblr.id': info.profile.id }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        res.render('login/index', {
          oauthMessage: 'No users found linked to your Tumblr account. You may need to create an account first.',
          oauthTwitter: !!req.app.config.oauth.twitter.key,
          oauthGitHub: !!req.app.config.oauth.github.key,
          oauthFacebook: !!req.app.config.oauth.facebook.key,
          oauthGoogle: !!req.app.config.oauth.google.key,
          oauthTumblr: !!req.app.config.oauth.tumblr.key
        });
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return next(err);
          }

          //res.redirect(getReturnUrl(req));
        });
      }
    });
  })(req, res, next);
};
