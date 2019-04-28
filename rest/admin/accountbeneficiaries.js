'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/admin/accountbeneficiaries');

    this.controllerAction = function() {
        this.jsonService(this.service('user/accountbeneficiaries/list'));
    };
}
listController.prototype = new ctrlFactory.list();


function getController() {
    ctrlFactory.get.call(this, '/rest/admin/accountbeneficiaries/:id');

    this.controllerAction = function() {
        this.jsonService(this.service('user/accountbeneficiaries/get'));
    };
}
getController.prototype = new ctrlFactory.get();





exports = module.exports = [
    listController,
    getController
];
