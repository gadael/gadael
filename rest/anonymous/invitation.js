'use strict';

const ctrlFactory = require('restitute').controller;
const loginPromise = require('../../modules/login');

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
function startPlannings(controller, userId, body, invitation) {
    const User = controller.req.app.db.models.User;
    const AccountCollection = controller.req.app.db.models.AccountCollection;
    const AccountScheduleCalendar = controller.req.app.db.models.AccountScheduleCalendar;
    const AccountNWDaysCalendar = controller.req.app.db.models.AccountNWDaysCalendar;

    let startDate = new Date();
    startDate.setHours(0,0,0,0);

    return User.findOne({ _id: userId })
    .exec()
    .then(user => {

        let promises = [];

        if (body.collection) {
            let accountCollection = new AccountCollection();
            accountCollection.account = user.roles.account;
            accountCollection.rightCollection = body.collection;
            accountCollection.from = startDate;
            promises.push(accountCollection.save());
        }

        if (body.scheduleCalendar) {
            let schedule = new AccountScheduleCalendar();
            schedule.account = user.roles.account;
            schedule.calendar = body.scheduleCalendar;
            schedule.from = startDate;
            promises.push(schedule.save());
        }

        if (invitation.nonWorkingDaysCalendar) {
            let nonworking = new AccountNWDaysCalendar();
            nonworking.account = user.roles.account;
            nonworking.calendar = invitation.nonWorkingDaysCalendar;
            nonworking.from = startDate;
            promises.push(nonworking.save());
        }

        return Promise.all(promises);
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

            // Add list of collections where the user will be allowed to register
            // this is because collection list is not accessible to annonymous
            // but only to this person thanks to the emailToken

            return document.model('RightCollection')
            .find({})
            .select('name')
            .exec()
            .then(collections => {
                invitation.collections = collections;
                return invitation;
            })
            .then(invitation => {

                // Add a list of workschedule calendars

                return document.model('Calendar')
                .find({ type: 'workschedule' })
                .select('name')
                .exec()
                .then(calendars => {
                    invitation.scheduleCalendars = calendars;
                    return invitation;
                });
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

        const gt = controller.req.app.utility.gettext;

        getInvitation(controller, controller.req.body.emailToken)
        .then(invitation => {

            if (!controller.req.body.newpassword) {
                throw new Error(gt.gettext('Password is mandatory'));
            }

            if (controller.req.body.newpassword !== controller.req.body.newpassword2) {
                throw new Error(gt.gettext('The two password fields must be equals'));
            }

            let userService = controller.service('admin/users/save', {
                isActive: true,
                isAdmin: false,
                isManager: false,
                isAccount: true,
                email: invitation.email,
                department: {
                    _id: invitation.department
                }
            });

            let params = controller.getServiceParameters(controller.req);

            let promise = userService.getResultPromise(params);

            return promise
            .then(user => {
                return loginPromise(controller.req, user)
                .then(() => {
                    let User = controller.req.app.db.models.User;
                    return User.findOne({ _id: user._id })
                    .exec();
                });
            })
            .then(user => {

                // start a period for the collection
                return startPlannings(controller, user._id, controller.req.body, invitation)
                .then(() => {
                    // refresh cache to display given quantity on home page
                    return user.updateRenewalsStat();
                });
            })
            .then(() => {
                invitation.done = true;
                return invitation.save();
            })
            .then(() => {
                controller.outputJsonFromPromise(userService, promise);
            });
        })
        .catch(err => {
            console.error(err);
            // here controller.error does not work because
            // controller.jsonService already returned the result
            // controller.error(err.message);
        });


    };
}
createController.prototype = new ctrlFactory.create();



exports = module.exports = [
    getController,
    createController
];
