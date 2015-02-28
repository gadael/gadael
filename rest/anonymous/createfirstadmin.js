'use strict';

var ctrlFactory = require('restitute').controller;


function getController() {
    ctrlFactory.get.call(this, '/rest/anonymous/createfirstadmin');

    this.controllerAction = function() {
        this.accessDenied('test');
    };
}
getController.prototype = new ctrlFactory.get();


function save() {
    this.jsonService(this.service('admin/users/save'));
}

function createController() {
    ctrlFactory.create.call(this, '/rest/anonymous/createfirstadmin');
    this.controllerAction = save;
}
createController.prototype = new ctrlFactory.create();



exports = module.exports = {
    get: getController,
    create: createController
};
