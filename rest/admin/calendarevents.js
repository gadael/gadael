'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/admin/calendarevents');

    this.controllerAction = function() {
        this.jsonService(this.service('user/calendarevents/list'));
    };
}
listController.prototype = new ctrlFactory.list();



exports = module.exports = [
    listController
];
