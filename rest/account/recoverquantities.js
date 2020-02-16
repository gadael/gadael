'use strict';

var ctrlFactory = require('restitute').controller;



function listController() {
    ctrlFactory.list.call(this, '/rest/account/recoverquantities');

    this.controllerAction = function() {
        if (!this.req.app.config.company.workperiod_recovery_by_approver) {
            return this.error('workperiod_recovery_by_approver disabled');
        }
        this.jsonService(this.service('user/recoverquantities/list'));
    };
}
listController.prototype = new ctrlFactory.list();


function getController() {
    ctrlFactory.get.call(this, '/rest/account/recoverquantities/:id');

    this.controllerAction = function() {
        if (!this.req.app.config.company.workperiod_recovery_by_approver) {
            return this.error('workperiod_recovery_by_approver disabled');
        }
        this.jsonService(this.service('user/recoverquantities/get'));
    };
}
getController.prototype = new ctrlFactory.get();



exports = module.exports = [
    listController,
    getController
];
