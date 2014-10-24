'use strict';

var ctrlFactory = require('../controller');

/*
exports = module.exports = {
    list: new ctrlFactory.list('/rest/admin/users'),
    get: new ctrlFactory.get('/rest/admin/users/:id'),
    create: new ctrlFactory.create('/rest/admin/users'),
    update: new ctrlFactory.update('/rest/admin/users/:id'),
    delete: new ctrlFactory.delete('/rest/admin/users/:id')
};

exports.list.controllerAction = function() {
    this.jsonService(this.service('admin/users/list'));
};

exports.get.controllerAction = function() {
    this.jsonService(this.service('admin/users/get'));
};

function save() {
    this.jsonService(this.service('admin/users/save'));
}

exports.create.controllerAction = save;
exports.update.controllerAction = save;

exports.delete.controllerAction = function() {
    this.jsonService(this.service('admin/users/delete'));
};
*/


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



exports = module.exports = {
    list: listController,
    get: getController,
    create: createController,
    update: updateController,
    delete: deleteController
}