'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/admin/accountrights');
    
    this.controllerAction = function() {
        this.jsonService(this.service('account/accountrights/list'));
    };
}
listController.prototype = new ctrlFactory.list();



exports = module.exports = {
    list: listController
};