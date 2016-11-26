'use strict';

const http = require('http');
const util = require('util');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth2' ).Strategy;

exports = module.exports = function(app, passport) {

    let loginservices = app.config.company.loginservices;
    let User = app.db.models.User;
    let gt = app.utility.gettext;





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
                return done(null, false, { message: 'Unknown user' });
            }

            User.validatePassword(password, user.password, function(err, isValid) {
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






    /**
     * Check if the account can be created from google profile
     * @param {Object} profile
     * @param {Function} callback
     */
    function canCreateProfile(profile, callback) {

        let email = profile.emails[0].value;

        if (!email) {
            return callback(new Error(gt.gettext('Google API problem: Email is mandatory')));
        }

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


        User.findOne({ 'google.profile': profile.id }, (err, user) => {
            if (!user) {
                // user not found, create from profile
                return canCreateProfile(profile, err => {

                    if (err) {
                      return done(err);
                    }

                    user = new User();
                    user.initFromGoogle(profile);
                    user.save(done);
                });
            }
            return done(err, user);
        });
    }


    if (loginservices.form.enabled) {
        passport.use(new LocalStrategy(useLocalStrategy));
    }




    if (loginservices.google.clientID) {

        const googleOptions = {
            clientID: loginservices.google.clientID,
            clientSecret: loginservices.google.clientSecret,
            callbackURL: app.config.url+'/fr/google-callback',
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

        User.findOne({ _id: id })
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
