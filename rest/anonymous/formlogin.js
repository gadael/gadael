'use strict';

const ctrlFactory = require('restitute').controller;
const abuseFilter = require('../../modules/abusefilter');



/**
 * Attempt a login
 * Resolve to a user document
 * @return {Promise}
 */
function attemptLogin(req, res) {

    let gt = req.app.utility.gettext;
    let loginAttempt = req.app.db.models.LoginAttempt;


    let userPromise = new Promise((resolve, reject) => {
        req._passport.instance.authenticate('local', function(err, user, info) {
            if (err) {
                return reject(err);
            }

            return user;
        })(req, res);
    });


    return userPromise
    .then(user => {

        if (!user) {
            let attempt = new loginAttempt();
            attempt.ip = req.ip;
            attempt.user = req.body.username;

            return attempt.save()
            .then(() => {
                throw new Error(gt.gettext('Username and password combination not found or your account is inactive.'));
            });
        }

        return user;


    });

}



/**
 * Promisification of req.login
 * This resolve to true
 * @return {Promise}
 */
function loginPromise(req, user)
{
    return new Promise((resolve, reject) => {
        req.login(user, function(err) {
            if (err) {
                return reject(err);
            }

            resolve(true);
        });
    });
}





/**
 * A POST on anonymous/formlogin
 * login with local strategie or ldap strategie
 */
function createController() {
    // TODO: change to /rest/annonymous/formlogin
    ctrlFactory.create.call(this, '/rest/login');

    let controller = this;

    controller.controllerAction = function() {

        let workflow = controller.req.app.utility.workflow(controller.req, controller.res);
        let gt = controller.req.app.utility.gettext;

        if (workflow.needRequiredFields(['username', 'password'])) {
            return workflow.emit('response');
        }

        return abuseFilter(controller.req)
        .then(() => {
            return attemptLogin(controller.req, controller.res);
        })
        .then(user => {
            return loginPromise(controller.req, user);
        })
        .then(() => {
            workflow.success(gt.gettext('You are now loged in'));
        })
        .catch(err => {
            workflow.httpstatus = 401;
            workflow.emit('exception', err.message);
        });

    };
}
createController.prototype = new ctrlFactory.create();


exports = module.exports = {
    create: createController
};
