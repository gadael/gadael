'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/account/collaborators');

    this.controllerAction = function() {
        this.jsonService(this.service('user/collaborators/list', { user: this.req.user.id }));
    };
}
listController.prototype = new ctrlFactory.list();



exports = module.exports = {
    list: listController
};
