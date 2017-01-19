'use strict';

const googlecalendar = require('./user/googlecalendar');


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
 * Object to load controllers in a file
 * @param {object} app
 */
function fileControllers(app)
{
    this.app = app;

    /**
     * @param {string} path
     */
    this.add = function(path) {

        var controllers = require(path);

        for(var ctrlName in controllers) {
            if (controllers.hasOwnProperty(ctrlName)) {

                var controller = new ControllerFactory(controllers[ctrlName]);

                // instance used only to register method and path into the app
                var inst = new controller.model();

                app[inst.method](inst.path, controller.onRequest);
            }
        }
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

    googlecalendar.init(app.config);

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

    controllers.add('./admin/users');
    controllers.add('./admin/usersstat');
    controllers.add('./admin/accountrights');
    controllers.add('./admin/accountcollections');
    controllers.add('./admin/accountschedulecalendars');
    controllers.add('./admin/accountnwdayscalendars');
    controllers.add('./admin/departments');
    controllers.add('./admin/collections');
    controllers.add('./admin/collection');
    controllers.add('./admin/calendars');
    controllers.add('./admin/calendarevents');
    controllers.add('./admin/personalevents');
    controllers.add('./admin/collaborators');
    controllers.add('./admin/unavailableevents');
    controllers.add('./admin/types');
    controllers.add('./admin/specialrights');
    controllers.add('./admin/rights');
    controllers.add('./admin/rightrenewals');
    controllers.add('./admin/accountbeneficiaries');
    controllers.add('./admin/beneficiaries');
    controllers.add('./admin/requests');
    controllers.add('./admin/waitingrequests');
    controllers.add('./admin/compulsoryleaves');
    controllers.add('./admin/adjustments');
    controllers.add('./admin/recoverquantities');
    controllers.add('./admin/timesavingaccounts');
    controllers.add('./admin/export');
    controllers.add('./admin/consumption');

    controllers.add('./anonymous/createfirstadmin');
    controllers.add('./anonymous/formlogin');

	app.post('/rest/login/forgot', require('./login').forgotPassword);
	app.post('/rest/login/reset', require('./login').resetPassword);
	app.get('/rest/logout', require('./logout').init);

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
            successRedirect: '/',
            failureRedirect: '/',
            failureFlash: true
        },function(err, user, info) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('/#/login');
            }

            req.login(user, loginErr => {
                if (loginErr) {
                    return next(loginErr);
                }
                return res.redirect('/');
            });
        })(req, res, next);
    });


	// tests
	app.get('/rest/populate', require('./tests/index').populate);



	//route not found
	app.all('*', require('./Common').http404);
};
