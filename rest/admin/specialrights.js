'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/admin/specialrights');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/specialrights/list'));
    };
}
listController.prototype = new ctrlFactory.list();



exports = module.exports = [listController];
