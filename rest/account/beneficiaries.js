'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/account/beneficiaries');

    this.controllerAction = function() {

        this.jsonService(this.service('user/accountbeneficiaries/list', { user: this.req.user }));
    };
}
listController.prototype = new ctrlFactory.list();


function getController() {
    ctrlFactory.get.call(this, '/rest/account/beneficiaries/:id');

    this.controllerAction = function() {
        // TODO: use a user parameter for optimal performance as in the list service
        this.jsonService(this.service('user/accountbeneficiaries/get', { account: this.req.user.roles.account.id }));
    };
}
getController.prototype = new ctrlFactory.get();





exports = module.exports = [
    listController,
    getController
];
