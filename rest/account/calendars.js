'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/account/calendars');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/calendars/list',  { user: this.req.user.id }));
    };
}
listController.prototype = new ctrlFactory.list();


function getController() {
    ctrlFactory.get.call(this, '/rest/account/calendars/:id');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/calendars/get',  { user: this.req.user.id }));
    };
}
getController.prototype = new ctrlFactory.get();


exports = module.exports = [
    listController,
    getController
];
