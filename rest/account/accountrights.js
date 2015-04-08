'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/account/accountrights');
    
    this.controllerAction = function() {

        if (!this.req.user) {
            throw 'Must be logged in';
        }

        this.jsonService(this.service('account/accountrights/list', { user: this.req.user._id }));
    };
}
listController.prototype = new ctrlFactory.list();



exports = module.exports = {
    list: listController
};
