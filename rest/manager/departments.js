'use strict';

var ctrlFactory = require('restitute').controller;

function listController() {
    ctrlFactory.list.call(this, '/rest/manager/departments');

    this.controllerAction = function() {
        this.jsonService(this.service('manager/departments/list', { user: this.req.user.id }));
    };
}
listController.prototype = new ctrlFactory.list();



exports = module.exports = [
    listController
];
