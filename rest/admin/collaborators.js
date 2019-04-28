'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/admin/collaborators');

    this.controllerAction = function() {
        this.jsonService(this.service('user/collaborators/list', { manager: true }));
    };
}
listController.prototype = new ctrlFactory.list();



exports = module.exports = [listController];
