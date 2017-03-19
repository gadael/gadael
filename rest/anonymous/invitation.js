'use strict';

const ctrlFactory = require('restitute').controller;


/**
 * Get invitation from email token
 */
function getInvitation(controller) {

    const gt = controller.req.app.utility.gettext;

    const service = controller.service('admin/invitations/list');

    return service.getResultPromise({ emailToken: controller.req.emailToken })
    .then(function(invitations) {
        if (1 !== invitations.length) {
            throw new Error(gt.gettext('Your invitation email is not valid'));
        }

        return invitations[0];
    });
}




/**
 * a GET on anonymous/invitation return an invitation object
 * This need the emailToken parameter
 */
function getController() {


    ctrlFactory.get.call(this, '/rest/anonymous/invitation');

    const controller = this;


    this.controllerAction = function() {
        getInvitation(controller)
        .then(function(invitation) {

            //TODO: Add list of collection where the user will be allowed to register
            // this is because collection list is not accessible to annonymous
            // but only to this person thanks to the emailToken

            controller.res.statusCode = 200;
            controller.res.json(invitation);
        })
        .catch(controller.accessDenied);
    };
}
getController.prototype = new ctrlFactory.get();




/**
 * A POST on anonymous/invitation create the user
 *
 */
function createController() {
    ctrlFactory.create.call(this, '/rest/anonymous/invitation');
    var controller = this;

    this.controllerAction = function() {

        getInvitation(controller)
        .then(function(invitation) {

            controller.jsonService(controller.service('admin/users/save', {
                isActive: true,
                isAdmin: false,
                isManager: false
            }));
        })
        .catch(controller.accessDenied);


    };
}
createController.prototype = new ctrlFactory.create();



exports = module.exports = {
    get: getController,
    create: createController
};
