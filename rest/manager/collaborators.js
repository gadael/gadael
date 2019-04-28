'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/manager/collaborators');

    this.controllerAction = function() {
        this.jsonService(this.service('user/collaborators/list', { user: this.req.user.id, manager: true }));
    };
}
listController.prototype = new ctrlFactory.list();



exports = module.exports = [
    listController
];
