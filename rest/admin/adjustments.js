'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/admin/adjustments');

    this.controllerAction = function() {
        this.jsonService(this.service('user/adjustments/list'));
    };
}
listController.prototype = new ctrlFactory.list();



function save() {
    this.jsonService(this.service('user/adjustments/save', { userCreated: this.req.user }));
}

function createController() {
    ctrlFactory.create.call(this, '/rest/admin/adjustments');
    this.controllerAction = save;
}
createController.prototype = new ctrlFactory.create();

function updateController() {
    ctrlFactory.update.call(this, '/rest/admin/adjustments/:id');
    this.controllerAction = save;
}
updateController.prototype = new ctrlFactory.update();




exports = module.exports = [
    listController,
    createController,
    updateController
];
