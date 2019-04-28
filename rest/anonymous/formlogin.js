'use strict';

const ctrlFactory = require('restitute').controller;
const abuseFilter = require('../../modules/abusefilter');
const attemptLogin = require('../../modules/attemptlogin');
const loginPromise = require('../../modules/login');










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
            return attemptLogin('local', controller);
        })
        .then(user => {
            return loginPromise(controller.req, user);
        })
        .then(() => {
            workflow.success(gt.gettext('You are now logged in'));
        })
        .catch(err => {
            console.log(err.stack);
            workflow.httpstatus = 400;
            workflow.emit('exception', err.message);
        });

    };
}
createController.prototype = new ctrlFactory.create();


exports = module.exports = [
    createController
];
