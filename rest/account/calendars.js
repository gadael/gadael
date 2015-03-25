'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/admin/calendars');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/calendars/list'));
    };
}
listController.prototype = new ctrlFactory.list();


function getController() {
    ctrlFactory.get.call(this, '/rest/admin/calendars/:id');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/calendars/get'));
    };
}
getController.prototype = new ctrlFactory.get();


exports = module.exports = {
    list: listController,
    get: getController
};
