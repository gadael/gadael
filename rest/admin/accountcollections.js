'use strict';

var ctrlFactory = require('../controller');

/*
exports = module.exports = {
    list: new ctrlFactory.list('/rest/admin/accountcollections'),
    get: new ctrlFactory.get('/rest/admin/accountcollections/:id'),
    create: new ctrlFactory.create('/rest/admin/accountcollections'),
    update: new ctrlFactory.update('/rest/admin/accountcollections/:id'),
    delete: new ctrlFactory.delete('/rest/admin/accountcollections/:id')
};

exports.list.controllerAction = function() {
    this.jsonService(this.service('admin/accountcollections/list'));
};

exports.get.controllerAction = function() {
    this.jsonService(this.service('admin/accountcollections/get'));
};

function save() {
    this.jsonService(this.service('admin/accountcollections/save'));
}

exports.create.controllerAction = save;
exports.update.controllerAction = save;

exports.delete.controllerAction = function() {
    this.jsonService(this.service('admin/accountcollections/delete'));
};
*/

function listController() {
    ctrlFactory.list.call(this, '/rest/admin/accountcollections');
    
    this.controllerAction = function() {
        this.jsonService(this.service('admin/accountcollections/list'));
    };
}
listController.prototype = new ctrlFactory.list();


function getController() {
    ctrlFactory.get.call(this, '/rest/admin/accountcollections/:id');
    
    this.controllerAction = function() {
        this.jsonService(this.service('admin/accountcollections/get'));
    };
}
getController.prototype = new ctrlFactory.get();


function save() {
    this.jsonService(this.service('admin/accountcollections/save'));
}

function createController() {
    ctrlFactory.create.call(this, '/rest/admin/accountcollections');
    this.controllerAction = save;
}
createController.prototype = new ctrlFactory.create();

function updateController() {
    ctrlFactory.update.call(this, '/rest/admin/accountcollections/:id');
    this.controllerAction = save;
}
updateController.prototype = new ctrlFactory.update();

function deleteController() {
    ctrlFactory.delete.call(this, '/rest/admin/accountcollections/:id');
    
    this.controllerAction = function() {
        this.jsonService(this.service('admin/accountcollections/delete'));
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