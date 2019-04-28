'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/admin/personalevents');

    this.controllerAction = function() {
        this.jsonService(this.service('user/personalevents/list'));
    };
}
listController.prototype = new ctrlFactory.list();



exports = module.exports = [
    listController
];
