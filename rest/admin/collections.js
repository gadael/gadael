'use strict';

var ctrlFactory = require('restitute').controller;



function listController() {
    ctrlFactory.list.call(this, '/rest/admin/collections');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/collections/list'));
    };
}
listController.prototype = new ctrlFactory.list();


function getController() {
    ctrlFactory.get.call(this, '/rest/admin/collections/:id');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/collections/get'));
    };
}
getController.prototype = new ctrlFactory.get();


function save() {
    this.jsonService(this.service('admin/collections/save'));
}

function createController() {
    ctrlFactory.create.call(this, '/rest/admin/collections');
    this.controllerAction = save;
}
createController.prototype = new ctrlFactory.create();

function updateController() {
    ctrlFactory.update.call(this, '/rest/admin/collections/:id');
    this.controllerAction = save;
}
updateController.prototype = new ctrlFactory.update();

function deleteController() {
    ctrlFactory.delete.call(this, '/rest/admin/collections/:id');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/collections/delete'));
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
