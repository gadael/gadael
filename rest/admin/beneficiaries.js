'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/admin/beneficiaries');
    
    this.controllerAction = function() {
        this.jsonService(this.service('account/beneficiaries/list'));
    };
}
listController.prototype = new ctrlFactory.list();


function getController() {
    ctrlFactory.get.call(this, '/rest/admin/beneficiaries/:id');
    
    this.controllerAction = function() {
        this.jsonService(this.service('account/beneficiaries/get'));
    };
}
getController.prototype = new ctrlFactory.get();


function save() {
    this.jsonService(this.service('account/beneficiaries/save'));
}

function createController() {
    ctrlFactory.create.call(this, '/rest/admin/beneficiaries');
    this.controllerAction = save;
}
createController.prototype = new ctrlFactory.create();

function updateController() {
    ctrlFactory.update.call(this, '/rest/admin/beneficiaries/:id');
    this.controllerAction = save;
}
updateController.prototype = new ctrlFactory.update();

function deleteController() {
    ctrlFactory.delete.call(this, '/rest/admin/beneficiaries/:id');
    
    this.controllerAction = function() {
        this.jsonService(this.service('account/beneficiaries/delete'));
    };
}
deleteController.prototype = new ctrlFactory.delete();



exports = module.exports = {
    list: listController,
    get: getController,
    create: createController,
    update: updateController,
    delete: deleteController
};
