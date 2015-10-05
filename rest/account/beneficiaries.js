'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/account/beneficiaries');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/beneficiaries/list', { account: this.req.user.roles.account.id }));
    };
}
listController.prototype = new ctrlFactory.list();


function getController() {
    ctrlFactory.get.call(this, '/rest/account/beneficiaries/:id');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/beneficiaries/get', { account: this.req.user.roles.account.id }));
    };
}
getController.prototype = new ctrlFactory.get();





exports = module.exports = {
    list: listController,
    get: getController
};
