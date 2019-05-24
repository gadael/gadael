'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/account/timesavingaccounts');

    this.controllerAction = function() {
        this.jsonService(this.service('user/timesavingaccounts/list', { account: this.req.user.roles.account.id }));
    };
}
listController.prototype = new ctrlFactory.list();



exports = module.exports = [listController];
