'use strict';

var ctrlFactory = require('restitute').controller;

function list() {
    this.jsonService(this.service('admin/users/list'));
}

function listController() {
    ctrlFactory.list.call(this, '/rest/admin/users');
    this.controllerAction = list;
}
listController.prototype = new ctrlFactory.list();


function apiListController() {
    ctrlFactory.list.call(this, '/api/admin/users');
    this.controllerAction = list;
}
apiListController.prototype = new listController();


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



exports = module.exports = {
    list: listController,
    apiList: apiListController,
    get: getController,
    create: createController,
    update: updateController,
    delete: deleteController
};
