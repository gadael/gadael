'use strict';

const ctrlFactory = require('restitute').controller;
const abuseFilter = require('../../modules/abusefilter');


/**
 * A POST on anonymous/formlogin
 * login with local strategie or ldap strategie
 */
function createController() {
    // TODO: change to /rest/annonymous/formlogin
    ctrlFactory.create.call(this, '/rest/login');

    let controller = this;

    this.controllerAction = function() {

        let workflow = controller.req.app.utility.workflow(controller.req, controller.res);


        function validate() {
            // TODO: rework this as Promise
            if (workflow.needRequiredFields(['username', 'password'])) {
                return workflow.emit('response');
            }

            abuseFilter(controller.req);
        }


        validate();
    };
}
createController.prototype = new ctrlFactory.create();


exports = module.exports = {
    create: createController
};
