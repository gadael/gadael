'use strict';
const ctrlFactory = require('restitute').controller;

function listController() {
    ctrlFactory.list.call(this, '/rest/admin/overtimesummary');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/overtimesummary/list'));
    };
}
listController.prototype = new ctrlFactory.list();

function convertController() {
    ctrlFactory.create.call(this, '/rest/admin/overtimesummary');
    const controller = this;
    this.controllerAction = function() {
        this.jsonService(this.service('admin/overtimesummary/save', {
            userCreated: controller.req.user
        }));
    };
}
convertController.prototype = new ctrlFactory.create();


exports = module.exports = [listController, convertController];
