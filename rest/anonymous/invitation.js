'use strict';

const ctrlFactory = require('restitute').controller;


/**
 * Get invitation from email token
 */
function getInvitation(controller) {

    const gt = controller.req.app.utility.gettext;
    const Invitation = controller.req.app.db.models.Invitation;

    console.log(controller.req.params);

    return Invitation.findOne({ emailToken: controller.req.params.emailToken })
    .then(function(invitation) {
        if (null === invitation) {
            throw new Error(gt.gettext('Your invitation email is not valid'));
        }

        return invitation;
    });
}




/**
 * a GET on anonymous/invitation return an invitation object
 * This need the emailToken parameter
 */
function getController() {


    ctrlFactory.get.call(this, '/rest/anonymous/invitation/:emailToken');

    const controller = this;


    this.controllerAction = function() {
        getInvitation(controller)
        .then(document => {

            let invitation = document.toObject();

            // Add list of collection where the user will be allowed to register
            // this is because collection list is not accessible to annonymous
            // but only to this person thanks to the emailToken

            return document.model('RightCollection')
            .find({})
            .select('name')
            .exec()
            .then(collections => {
                invitation.collections = collections;
                return invitation;
            });
        })
        .then(invitation => {
            controller.res.statusCode = 200;
            controller.res.json(invitation);
        })
        .catch(err => controller.error(err.message));
    };
}
getController.prototype = new ctrlFactory.get();




/**
 * A POST on anonymous/invitation create the user
 *
 */
function createController() {
    ctrlFactory.create.call(this, '/rest/anonymous/invitation/:emailToken');
    var controller = this;

    this.controllerAction = function() {

        getInvitation(controller)
        .then(function(invitation) {

            let userService = controller.service('admin/users/save', {
                isActive: true,
                isAdmin: false,
                isManager: false
            });

            return controller.jsonService(userService)
            .then(() => {
                invitation.done = true;
                return invitation.save();
            });
        })
        .catch(err => controller.error(err.message));


    };
}
createController.prototype = new ctrlFactory.create();



exports = module.exports = {
    get: getController,
    create: createController
};
