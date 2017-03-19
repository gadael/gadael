'use strict';

const ctrlFactory = require('restitute').controller;


/**
 * Get invitation from email token
 */
function getInvitation(controller, emailToken) {

    const gt = controller.req.app.utility.gettext;
    const Invitation = controller.req.app.db.models.Invitation;

    return Invitation.findOne({ emailToken: emailToken })
    .then(function(invitation) {
        if (null === invitation) {
            throw new Error(gt.gettext('Your invitation email is not valid'));
        }

        return invitation;
    });
}


/**
 * Save a collection period
 */
function startCollection(controller, userId, collectionId) {
    const User = controller.req.app.db.models.User;
    const AccountCollection = controller.req.app.db.models.AccountCollection;

    return User.findOne({ _id: userId })
    .exec()
    .then(user => {
        let accountCollection = new AccountCollection();
        accountCollection.account = user.roles.account;
        accountCollection.rightCollection = collectionId;
        accountCollection.from = new Date();
        accountCollection.from.setHours(0,0,0,0);
        return accountCollection.save();
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
        getInvitation(controller, controller.req.params.emailToken)
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
    ctrlFactory.create.call(this, '/rest/anonymous/invitation');
    var controller = this;

    this.controllerAction = function() {

        getInvitation(controller, controller.req.body.emailToken)
        .then(invitation => {

            let userService = controller.service('admin/users/save', {
                isActive: true,
                isAdmin: false,
                isManager: false,
                email: invitation.email
            });


            return controller.jsonService(userService)
            .then(user => {

                if (!controller.req.body.collection) {
                    // no link to collection
                    return null;
                }

                // start a period for the collection
                return startCollection(controller, user._id, controller.req.body.collection);
            })
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
