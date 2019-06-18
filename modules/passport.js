'use strict';

const http = require('http');
const util = require('util');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth2' ).Strategy;
const HeaderStrategy = require('passport-trusted-header').Strategy;
const usercreated = require('./emails/usercreated');

// TODO http://www.passportjs.org/packages/passport-trusted-header/

exports = module.exports = function(app, passport) {

    let loginservices = app.config.company.loginservices;
    let User = app.db.models.User;
    let gt = app.utility.gettext;

    passport.db = app.db;



    /**
     * Local strategy callback, login with form
     * @param {String} username     User input
     * @param {String} password     User input
     * @param {Function} done
     */
    function useLocalStrategy(username, password, done) {

        let conditions = {
            isActive: true,
            email: username
        };

        User
        .findOne(conditions)
        .select('+password')
        .exec(function(err, user) {
            if (err) {
                return done(err);
            }

            if (!user) {
                return done(null, false, { message: gt.gettext('Unknown user') });
            }

            if (!user.password) {
                return done(null, false, { message: gt.gettext('No password set on user') });
            }

            User.validatePassword(password, user.password, function(err, isValid) {
                if (err) {
                    return done(err);
                }

                if (!isValid) {
                    return done(null, false, { message: gt.gettext('Invalid password') });
                }

                return done(null, user);
            });
        });
    }




    /**
     * Check if the account can be created from google profile
     * @param {Object} profile
     * @param {Function} callback
     */
    function canCreateProfile(profile, callback) {

        let email = profile.emails[0].value;
        let domain = loginservices.google.domain;

        if (!domain) {
            return callback(new Error(gt.gettext('Creation of a new account is not allowed on this application')));
        }

        if (-1 === '@'+domain.indexOf(email)) {
            return callback(new Error(util.format(gt.gettext('Only email from %s are allowed'), domain)));
        }

        // if the email allready exists

        User.findOne({ email: email }).exec()
        .then(user => {
            if (null === user) {
                return callback(null);
            }
        })
        .catch(callback);
    }



    /**
    * Google strategy callback
    * @param {ClientRequest} request
    * @param {String} accessToken
    * @param {String} refreshToken
    * @param {Object} profile          Contain google user profile
    * @param {Function} done           Callback, wait for error and user object
    */
    function useGoogleStrategy(request, accessToken, refreshToken, profile, done) {

        if (request.user) {
            // Allready authenticated, but not linked to google account
            if (undefined === request.user.google) {
                request.user.google = {};
            }
            request.user.google.profile = profile.id;
            request.user.save(done);
            return;
        }


        if (!profile.emails[0].value) {
            return done(new Error(gt.gettext('Google API problem: Email is mandatory')));
        }


        User.findOne({ $or: [
            { 'google.profile': profile.id },
            { 'email': profile.emails[0].value }
        ] }).exec()
        .then(user => {
            if (!user) {
                // user not found by profile ID or by email
                // create from profile
                return canCreateProfile(profile, err => {

                    if (err) {
                        return done(err);
                    }

                    user = new User();
                    user.initFromGoogle(profile);
                    user.save()
                    .then(savedUser => {
                        done(savedUser);
                        // send an email to admins because of the new user without absence account
                        return usercreated(request.app, savedUser);
                    })
                    .then(mail => {
                        return mail.send();
                    });
                });
            }

            // user found

            return done(null, user);
        })
        .catch(done);

    }

	var options =  {
	  headers: ['x_cas_mail'],
	  passReqToCallback: true
	}

    function useHeaderStrategy(request, requestHeaders, done) {
		var mail = request.headers["x_cas_mail"];

        if (!mail) {
            done(null, null);
        }

        User.findOne({ 'email': mail }).exec()
        .then(user => {
            // user found

            return done(null, user);
        })
        .catch(done);
    }
	passport.use(new HeaderStrategy(options, useHeaderStrategy));

    if (loginservices.form.enable) {
        passport.use(new LocalStrategy(useLocalStrategy));
    }

    if (loginservices.google.enable) {

        const googleOptions = {
            clientID: loginservices.google.clientID,
            clientSecret: loginservices.google.clientSecret,
            callbackURL: app.config.url+'login/google-callback',
            passReqToCallback: true
        };

        passport.use(new GoogleStrategy(googleOptions, useGoogleStrategy));
    }




    /**
     * Serialize user once connected
     */
    passport.serializeUser((user, done) => {
        let company = app.config.company;
        if (company) {
            company.lastLogin = new Date();
            company.save();
        }

        done(null, user._id);
    });

    passport.deserializeUser((id, done) => {

        // here, if i use app.db instead of passport.db, tests fail with a socket hangup
        passport.db.models.User.findOne({ _id: id })
        .populate('department')
        .populate('roles.admin')
        .populate('roles.manager')
        .populate('roles.account')
        .exec(function(err, user) {

            if (null === user) {
                console.error('User not found in deserializeUser '+id+' -> NULL');
            }

            done(err, user);
        });
    });


   let req = http.IncomingMessage.prototype;

	/**
	 * Test if logged in
	 * output a 401 unauthorized header on failure
	 */
	req.ensureAuthenticated = function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }

        var workflow = req.app.utility.workflow(req, res);


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

        let workflow = req.app.utility.workflow(req, res);
        let gt = req.app.utility.gettext;

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
