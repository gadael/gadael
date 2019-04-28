'use strict';

var ctrlFactory = require('restitute').controller;


function getController() {
    ctrlFactory.get.call(this, '/rest/admin/usersstat');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/usersstat/get'));
    };
}
getController.prototype = new ctrlFactory.get();


exports = module.exports = [
    getController
];
