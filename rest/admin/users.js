'use strict';
const ctrlFactory = require('restitute').controller;

function listController() {
    ctrlFactory.list.call(this, '/rest/admin/users');
    this.controllerAction = function() {
        this.jsonService(this.service('admin/users/list'));
    };
}
listController.prototype = new ctrlFactory.list();

function getController() {
    ctrlFactory.get.call(this, '/rest/admin/users/:id');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/users/get'));
    };
}
getController.prototype = new ctrlFactory.get();


function save() {
    this.jsonService(this.service('admin/users/save'));
}

function createController() {
    ctrlFactory.create.call(this, '/rest/admin/users');
    this.controllerAction = save;
}
createController.prototype = new ctrlFactory.create();

function updateController() {
    ctrlFactory.update.call(this, '/rest/admin/users/:id');
    this.controllerAction = save;
}
updateController.prototype = new ctrlFactory.update();

function deleteController() {
    ctrlFactory.delete.call(this, '/rest/admin/users/:id');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/users/delete'));
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
