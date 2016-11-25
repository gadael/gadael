'use strict';

const ctrlFactory = require('restitute').controller;
const abuseFilter = require('../../modules/abusefilter');
const attemptLogin = require('../../modules/attemptlogin');






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
    // TODO: change to /rest/anonymous/formlogin
    ctrlFactory.create.call(this, '/rest/anonymous/formlogin');

    let controller = this;

    controller.controllerAction = function() {

        let workflow = controller.req.app.utility.workflow(controller.req, controller.res);
        let gt = controller.req.app.utility.gettext;

        if (workflow.needRequiredFields(['username', 'password'])) {
            return workflow.emit('response');
        }

        return abuseFilter(controller.req)
        .then(() => {
            return attemptLogin('local', controller.req, controller.res);
        })
        .then(user => {
            return loginPromise(controller.req, user);
        })
        .then(() => {
            workflow.success(gt.gettext('You are now loged in'));
        })
        .catch(err => {
            workflow.httpstatus = 400;
            workflow.emit('exception', err.message);
        });

    };
}
createController.prototype = new ctrlFactory.create();


exports = module.exports = {
    create: createController
};
