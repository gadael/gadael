'use strict';

const googlecalendar = require('./user/googlecalendar');
const decodeUrlEncodedBody = require('body-parser').urlencoded({ extended: false });

/**
 * Object to create controller on request
 *
 * @param {restController} model    A rest controller class to use on request
 */
function ControllerFactory(model) {

    this.model = model;
    var factory = this;

    this.onRequest = function(req, res, next) {
        var actionController = new factory.model();
        actionController.onRequest(req, res, next);
    };
}

/**
 * Create a controller for API calls
 * @param {Function} controller
 * @return {Function}
 */
function createApiController(controller) {
    const apiController = function() {
        controller.call(this);
        this.path = this.path.replace(/^\/rest\//, '/api/');
    };
    apiController.prototype = controller;
    return apiController;
}

/**
 * Object to load controllers in a file
 * @param {object} app
 */
function fileControllers(app)
{
    this.app = app;

    function addController(controller) {
        const ctrlFactory = new ControllerFactory(controller);
        const inst = new ctrlFactory.model();
        app[inst.method](inst.path, ctrlFactory.onRequest);
    }

    /**
     * @param {string} path
     * @param {boolean} api
     */
    this.add = function(path, api) {
        api = api || false;
        require(path).forEach(controller => {
            addController(controller);
            if (api) {
                addController(createApiController(controller));
            }
        });
    };
}


/**
 * Load routes for the REST services
 * @param {express|object} app
 * @param {passport} passport
 */
exports = module.exports = function(app, passport)
{
    var controllers = new fileControllers(app);


	app.get('/rest/common', require('./Common').getInfos);


    controllers.add('./user/user');
    controllers.add('./user/settings');
    controllers.add('./user/calendarevents');
    controllers.add('./user/googlecalendars');

    app.get('/rest/user/googlecalendar', googlecalendar.login);
    app.get('/rest/user/googlecalendar/callback', googlecalendar.callback, googlecalendar.next);
    app.get('/rest/user/googlecalendar/logout', googlecalendar.logout);

    controllers.add('./account/accountrights');
    controllers.add('./account/adjustments');
    controllers.add('./account/calendars');
    controllers.add('./account/personalevents');
    controllers.add('./account/collaborators');
    controllers.add('./account/unavailableevents');
    controllers.add('./account/requests');
    controllers.add('./account/collection');
    controllers.add('./account/beneficiaries');
    controllers.add('./account/recoverquantities');
    controllers.add('./account/timesavingaccounts');
    controllers.add('./account/consumption');


    controllers.add('./manager/waitingrequests');
    controllers.add('./manager/collaborators');
    controllers.add('./manager/departments');

    controllers.add('./admin/users', true);
    controllers.add('./admin/usersstat', true);
    controllers.add('./admin/apitokens');
    controllers.add('./admin/accountrights', true);
    controllers.add('./admin/accountcollections', true);
    controllers.add('./admin/accountschedulecalendars');
    controllers.add('./admin/accountnwdayscalendars');
    controllers.add('./admin/departments', true);
    controllers.add('./admin/collections');
    controllers.add('./admin/collection');
    controllers.add('./admin/calendars', true);
    controllers.add('./admin/calendarevents', true);
    controllers.add('./admin/personalevents', true);
    controllers.add('./admin/collaborators', true);
    controllers.add('./admin/unavailableevents', true);
    controllers.add('./admin/types', true);
    controllers.add('./admin/specialrights', true);
    controllers.add('./admin/rights', true);
    controllers.add('./admin/rightrenewals', true);
    controllers.add('./admin/accountbeneficiaries', true);
    controllers.add('./admin/beneficiaries', true);
    controllers.add('./admin/requests', true);
    controllers.add('./admin/waitingrequests', true);
    controllers.add('./admin/compulsoryleaves');
    controllers.add('./admin/adjustments');
    controllers.add('./admin/recoverquantities');
    controllers.add('./admin/timesavingaccounts');
    controllers.add('./admin/export', true);
    controllers.add('./admin/consumption', true);
    controllers.add('./admin/invitations', true);
    controllers.add('./admin/lunchs');
    controllers.add('./admin/overtimes', true);
    controllers.add('./admin/overtimesummary', true);

    controllers.add('./anonymous/createfirstadmin');
    controllers.add('./anonymous/invitation');
    controllers.add('./anonymous/formlogin');



	app.post('/rest/login/forgot', require('./login').forgotPassword);
	app.post('/rest/login/reset', require('./login').resetPassword);
	app.get('/rest/logout', require('./logout').init);

    app.get('/login/header', passport.authenticate('trusted-header', {
        successRedirect: app.config.url,
        failureRedirect: app.config.url+'#/login'
    }));

    app.get('/login/cas', (req, res, next) => {
        passport.authenticate('cas', function(err, user, info) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect(app.config.url+'#/login');
            }

            req.login(user, loginErr => {
                if (loginErr) {
                    return next(loginErr);
                }
                return res.redirect(app.config.url);
            });
        })(req, res, next);
    });

	// redirect
    app.get('/login/google', (req, res, next) => {
        passport.authenticate('google', {
            scope: [
                'https://www.googleapis.com/auth/plus.login',
                'https://www.googleapis.com/auth/plus.profile.emails.read'
            ]
        })(req, res, next);
    });

    app.get('/login/google-callback', (req, res, next) => {
        passport.authenticate( 'google', {
            successRedirect: app.config.url,
            failureRedirect: app.config.url,
            failureFlash: true
        },function(err, user, info) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect(app.config.url+'#/login');
            }

            req.login(user, loginErr => {
                if (loginErr) {
                    return next(loginErr);
                }
                return res.redirect(app.config.url);
            });
        })(req, res, next);
    });

    const oauth = require('../modules/oauth')(app);
    app.post('/login/oauth-token', decodeUrlEncodedBody, oauth.token());

    // avatars
    app.get('/users/:userid/image', require('./image').getUserImage);

	// tests
	//app.get('/rest/populate', require('./tests/index').populate);



	//route not found
	app.all('*', require('./Common').http404);
};
