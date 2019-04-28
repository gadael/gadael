'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/admin/accountnwdayscalendars');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/accountnwdayscalendars/list'));
    };
}
listController.prototype = new ctrlFactory.list();


function getController() {
    ctrlFactory.get.call(this, '/rest/admin/accountnwdayscalendars/:id');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/accountnwdayscalendars/get'));
    };
}
getController.prototype = new ctrlFactory.get();


function save() {
    this.jsonService(this.service('admin/accountnwdayscalendars/save'));
}

function createController() {
    ctrlFactory.create.call(this, '/rest/admin/accountnwdayscalendars');
    this.controllerAction = save;
}
createController.prototype = new ctrlFactory.create();

function updateController() {
    ctrlFactory.update.call(this, '/rest/admin/accountnwdayscalendars/:id');
    this.controllerAction = save;
}
updateController.prototype = new ctrlFactory.update();

function deleteController() {
    ctrlFactory.delete.call(this, '/rest/admin/accountnwdayscalendars/:id');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/accountnwdayscalendars/delete'));
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
