'use strict';

var ctrlFactory = require('restitute').controller;


function listController() {
    ctrlFactory.list.call(this, '/rest/account/accountrights');

    this.controllerAction = function() {

        if (!this.req.user) {
            throw 'Must be logged in';
        }

        this.jsonService(this.service('account/accountrights/list', { activeFor: 'account', user: this.req.user.id }));
    };
}
listController.prototype = new ctrlFactory.list();



exports = module.exports = [listController];
