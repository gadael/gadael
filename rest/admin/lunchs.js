'use strict';
const ctrlFactory = require('restitute').controller;

function listController() {
    ctrlFactory.list.call(this, '/rest/admin/lunchs');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/lunchs/list'));
    };
}
listController.prototype = new ctrlFactory.list();


exports = module.exports = [listController];
