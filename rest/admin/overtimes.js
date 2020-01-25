'use strict';

var ctrlFactory = require('restitute').controller;



function listController() {
    ctrlFactory.list.call(this, '/rest/admin/overtimes');

    this.controllerAction = function() {
        this.jsonService(this.service('user/overtimes/list'));
    };
}
listController.prototype = new ctrlFactory.list();


function getController() {
    ctrlFactory.get.call(this, '/rest/admin/overtimes/:id');

    this.controllerAction = function() {
        this.jsonService(this.service('user/overtimes/get'));
    };
}
getController.prototype = new ctrlFactory.get();




function createController() {
    ctrlFactory.create.call(this, '/rest/admin/overtimes');
    let controller = this;
    this.controllerAction = function() {

        // since service is query independant, we have to give
        // the additional parameter

        controller.jsonService(
            controller.service('user/overtimes/save', {
                createdBy: controller.req.user
            })
        );
    };
}

function save() {
    this.jsonService(this.service('user/overtimes/save'));
}

createController.prototype = new ctrlFactory.create();

function updateController() {
    ctrlFactory.update.call(this, '/rest/admin/overtimes/:id');
    this.controllerAction = save;
}
updateController.prototype = new ctrlFactory.update();

function deleteController() {
    ctrlFactory.delete.call(this, '/rest/admin/overtimes/:id');

    var controller = this;
    this.controllerAction = function() {
        this.jsonService(this.service('user/overtimes/delete', {
            deletedBy: controller.req.user
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
