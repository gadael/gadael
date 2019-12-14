'use strict';
const ctrlFactory = require('restitute').controller;

function listController() {
    ctrlFactory.list.call(this, '/rest/admin/lunchs');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/lunchs/list'));
    };
}
listController.prototype = new ctrlFactory.list();

function refreshController() {
    ctrlFactory.create.call(this, '/rest/admin/lunchs');
    this.controllerAction = function() {
        this.jsonService(this.service('admin/lunchs/save'));
    };
}
refreshController.prototype = new ctrlFactory.create();


exports = module.exports = [listController, refreshController];
