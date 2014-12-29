'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/account/accountrights');
    
    this.controllerAction = function() {
        this.jsonService(this.service('account/accountrights/list', { user: this.req.user._id }));
    };
}
listController.prototype = new ctrlFactory.list();



exports = module.exports = {
    list: listController
};