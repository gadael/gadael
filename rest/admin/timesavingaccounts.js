'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/admin/timesavingaccounts');

    this.controllerAction = function() {
        this.jsonService(this.service('user/timesavingaccounts/list'));
    };
}
listController.prototype = new ctrlFactory.list();



exports = module.exports = [
    listController
];
