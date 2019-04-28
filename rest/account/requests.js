'use strict';

var ctrlFactory = require('restitute').controller;



function listController() {
    ctrlFactory.list.call(this, '/rest/account/requests');

    this.controllerAction = function() {
        this.jsonService(this.service('user/requests/list', { 'user.id': this.req.user._id }));
    };
}
listController.prototype = new ctrlFactory.list();


function getController() {
    ctrlFactory.get.call(this, '/rest/account/requests/:id');

    this.controllerAction = function() {
        this.jsonService(this.service('user/requests/get', {
            accessDeleted: false,
            user: this.req.user.id
        }));
    };
}
getController.prototype = new ctrlFactory.get();



function createController() {
    ctrlFactory.create.call(this, '/rest/account/requests');

    var controller = this;
    this.controllerAction = function() {

        // since service is query independant, we have to give
        // the additional parameter

        controller.jsonService(
            controller.service('user/requests/save', {
                user: controller.req.user._id,
                createdBy: controller.req.user,
                timeCreated: new Date(),
                useApproval: true
            })
        );
    };
}
createController.prototype = new ctrlFactory.create();



function updateController() {
    ctrlFactory.update.call(this, '/rest/account/requests/:id');

    var controller = this;
    this.controllerAction = function() {

        // since service is query independant, we have to give
        // the additional parameter

        controller.jsonService(
            controller.service('user/requests/save', {
                user: controller.req.user._id,
                modifiedBy: controller.req.user,
                useApproval: true
            })
        );
    };
}
updateController.prototype = new ctrlFactory.update();

function deleteController() {
    ctrlFactory.delete.call(this, '/rest/account/requests/:id');

    var controller = this;

    this.controllerAction = function() {
        this.jsonService(this.service('user/requests/delete', {
            user: controller.req.user._id, // filtered by this user for security
            deletedBy: controller.req.user,
            useApproval: true
        }));
    };
}
deleteController.prototype = new ctrlFactory.delete();



exports = module.exports = [
    listController,
    getController,
    createController,
    updateController,
    deleteController
];
