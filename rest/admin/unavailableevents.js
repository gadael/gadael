'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/admin/unavailableevents');

    this.controllerAction = function() {
        this.jsonService(this.service('user/unavailableevents/list'));
    };
}
listController.prototype = new ctrlFactory.list();



exports = module.exports = [
    listController
];
