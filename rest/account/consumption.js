'use strict';

var ctrlFactory = require('restitute').controller;

/**
 * Estimate the consumption for a request
 *
 * rest service parameters are:
 *  dtstart
 *  dtend
 *
 */
function getController() {
    ctrlFactory.get.call(this, '/rest/account/consumption');
    var ctrl = this;

    ctrl.controllerAction = function() {
        ctrl.jsonService(ctrl.service('account/collection/get', { user: this.req.user.id }));
    };
}
getController.prototype = new ctrlFactory.get();



exports = module.exports = {
    get: getController
};
