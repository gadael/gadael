'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/user/googlecalendars');

    this.controllerAction = function() {
        this.jsonService(this.service('user/googlecalendars/list', { user: this.req.user }));
    };
}
listController.prototype = new ctrlFactory.list();


function getController() {
    ctrlFactory.get.call(this, '/rest/user/googlecalendars/:id');

    this.controllerAction = function() {
        this.jsonService(this.service('user/googlecalendars/get', { user: this.req.user }));
    };
}
getController.prototype = new ctrlFactory.get();




function createController() {
    ctrlFactory.create.call(this, '/rest/user/googlecalendars');
    this.controllerAction = function() {
        this.jsonService(this.service('user/googlecalendars/save', { user: this.req.user }));
    };
}
createController.prototype = new ctrlFactory.create();



exports = module.exports = [
    listController,
    getController,
    createController
];
