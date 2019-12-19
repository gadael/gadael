'use strict';

const ctrlFactory = require('restitute').controller;
const loginPromise = require('../../modules/login');


/**
 * a GET on anonymous/createfirstadmin return a boolean
 * test if the first admin can be created or not
 */
function getController() {
    ctrlFactory.get.call(this, '/rest/anonymous/createfirstadmin');

    var controller = this;

    this.controllerAction = function() {
        var service = controller.service('admin/users/list');
        var promise = service.getResultPromise({}); // no parameters, no pagination

        promise.then(function(users) {
            var createFirstAdminAllowed = (0 === users.length);
            controller.res.statusCode = service.httpstatus;
            controller.res.json({
                allowed: createFirstAdminAllowed
            });
        }).catch(function(err) {
            controller.res.statusCode = service.httpstatus;
            controller.res.json({ $outcome: service.outcome });
        });
    };
}
getController.prototype = new ctrlFactory.get();




/**
 * A POST on anonymous/createfirstadmin create the first admin
 *
 */
function createController() {
    ctrlFactory.create.call(this, '/rest/anonymous/createfirstadmin');
    var controller = this;

    this.controllerAction = function() {

        // Do not save first admin twice
        let service = controller.service('admin/users/list');
        let promise = service.getResultPromise({}); // no parameters, no pagination
        const gt = service.app.utility.gettext;

        promise.then(function(users) {
            if (0 !== users.length) {
                controller.accessDenied(gt.gettext('The first admin already exists'));
                return;
            }

            let userService = controller.service('admin/users/save', {
                isActive: true,
                isAdmin: true
            });

            let params = controller.getServiceParameters(controller.req);

            let promise = userService.getResultPromise(params);

            return promise
            .then(user => {
                return loginPromise(controller.req, user);
            })
            .then(() => {
                controller.outputJsonFromPromise(userService, promise);
            });

        });


    };
}
createController.prototype = new ctrlFactory.create();



exports = module.exports = [
    getController,
    createController
];
