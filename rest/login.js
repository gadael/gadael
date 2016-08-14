'use strict';

const async = require('async');
const crypto = require('crypto');
const util = require('util');
const resetpassword = require('../modules/emails/resetpassword');

/**
 * Authenticate with a post and fields
 *  - username
 *  - password
 */
exports.authenticate = function(req, res) {

	var gt = req.app.utility.gettext;

	var workflow = req.app.utility.workflow(req, res);

	  workflow.on('validate', function() {
		if (workflow.needRequiredFields(['username', 'password'])) {
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
			workflow.outcome.alert.push({
				type: 'warning',
				message: gt.gettext("You've reached the maximum number of login attempts. Please try again later.")
			});
			return workflow.emit('response');
		  }
		  else {
			workflow.emit('attemptLogin');
		  }
		};

		async.parallel({
            ip: getIpCount,
            ipUser: getIpUserCount
        }, asyncFinally);
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

			  workflow.outcome.alert.push({
				  type: 'danger',
				  message: gt.gettext('Username and password combination not found or your account is inactive.')
			  });
			  return workflow.emit('response');
			});
		  }
		  else {
			req.login(user, function(err) {
			  if (err) {
				return workflow.emit('exception', err);
			  }

			  workflow.outcome.alert.push({
				  type: 'info',
				  message: gt.gettext('You are now loged in')
			  });
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

		workflow.outcome.alert.push({
			type: 'danger',
			message: util.format(gt.gettext('No user found with email %s'), req.body.email.toLowerCase())
		});
        return workflow.emit('response');
      }


      workflow.emit('sendEmail', token, user);
    });
  });


	workflow.on('sendEmail', function(token, user) {

		resetpassword(req.app, token, user)
		.send()
		.then(() => {
		  var gt = req.app.utility.gettext;

		  workflow.outcome.alert.push({
				  type: 'info',
				  message: util.format(gt.gettext('An email has been sent to %s'), user.email)
		  });

		  workflow.emit('response');
		})
		.catch(err => {
		  workflow.outcome.alert.push({
					type: 'danger',
					message: 'Error Sending: '+ err.getMessage()
			  });
		  workflow.emit('response');
		});
	});

	workflow.emit('validate');
};







/**
 * Reset password
 */
exports.resetPassword = function(req, res) {

	var workflow = req.app.utility.workflow(req, res);

	  workflow.on('validate', function() {

		if (!req.body.password) {
		  workflow.outcome.errfor.password = 'required';
		  workflow.httpstatus = 400; // Bad Request
		}

		if (!req.body.confirm) {
		  workflow.outcome.errfor.confirm = 'required';
		  workflow.httpstatus = 400; // Bad Request
		}

		if (req.body.confirm !== req.body.password) {
		  workflow.outcome.errfor.confirm = 'error';
		  workflow.httpstatus = 400; // Bad Request
		  workflow.outcome.alert.push({
				type: 'danger',
				message: req.app.utility.gettext.gettext('The password confirmation does not match the new password field')
			});
		}

		if (workflow.hasErrors()) {
		  return workflow.emit('response');
		}

		workflow.emit('findUser');
	  });


	workflow.on('findUser', function() {

		var conditions = {
		  email: req.body.email,
		  resetPasswordExpires: { $gt: Date.now() }
		};
		req.app.db.models.User.findOne(conditions, function(err, user) {
		  if (err) {
			return workflow.emit('exception', err);
		  }

		  if (!user) {
			workflow.outcome.alert.push({
				type: 'danger',
				message: req.app.utility.gettext.gettext('Invalid request. user not found')
			});
			return workflow.emit('response');
		  }

		  req.app.db.models.User.validatePassword(req.body.token, user.resetPasswordToken, function(err, isValid) {
			if (err) {
			  return workflow.emit('exception', err);
			}

			if (!isValid) {
			  workflow.outcome.alert.push({
					type: 'danger',
					message: req.app.utility.gettext.gettext('Invalid request.')
				});
			  return workflow.emit('response');
			}

			workflow.emit('patchUser', user);
		  });
		});
	  });

	  workflow.on('patchUser', function(user) {
		req.app.db.models.User.encryptPassword(req.body.password, function(err, hash) {
		  if (err) {
			return workflow.emit('exception', err);
		  }

		  var fieldsToSet = { password: hash, resetPasswordToken: '' };
		  req.app.db.models.User.findByIdAndUpdate(user._id, fieldsToSet, function(err, user) {
			if (err) {
			  return workflow.emit('exception', err);
			}

			workflow.outcome.alert.push({
				type: 'success',
				message: req.app.utility.gettext.gettext('The password has been modified')
			});
			workflow.emit('response');
		  });
		});
	  });

	 workflow.emit('validate');
};







exports.loginTwitter = function(req, res, next){
    req._passport.instance.authenticate('twitter', function(err, user, info) {

        if (err) {
            return next(err);
        }

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

        if (!err) {
          return next(err);
        }

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

        if (err) {
          return next(err);
        }

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

        if (err) {
          return next(err);
        }

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

        if (err) {
            return next(err);
        }

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
