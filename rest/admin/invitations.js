'use strict';

var ctrlFactory = require('restitute').controller;



function listController() {
    ctrlFactory.list.call(this, '/rest/admin/invitations');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/invitations/list'));
    };
}
listController.prototype = new ctrlFactory.list();


function getController() {
    ctrlFactory.get.call(this, '/rest/admin/invitations/:id');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/invitations/get'));
    };
}
getController.prototype = new ctrlFactory.get();




function createController() {
    ctrlFactory.create.call(this, '/rest/admin/invitations');
    let controller = this;
    this.controllerAction = function() {

        // since service is query independant, we have to give
        // the additional parameter

        controller.jsonService(
            controller.service('admin/invitations/save', {
                createdBy: controller.req.user
            })
        );
    };
}

function save() {
    this.jsonService(this.service('admin/invitations/save'));
}

createController.prototype = new ctrlFactory.create();

function updateController() {
    ctrlFactory.update.call(this, '/rest/admin/invitations/:id');
    this.controllerAction = save;
}
updateController.prototype = new ctrlFactory.update();

function deleteController() {
    ctrlFactory.delete.call(this, '/rest/admin/invitations/:id');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/invitations/delete'));
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
