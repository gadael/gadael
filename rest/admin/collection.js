'use strict';

var ctrlFactory = require('restitute').controller;

/**
 * Get the collection for a user account
 * according to a date interval
 * This is collection object to use when creating a vacation request
 *
 * rest service parameters are:
 *  user
 *  dtstart
 *  dtend
 *
 */
function getController() {
    ctrlFactory.get.call(this, '/rest/admin/collection');
    var ctrl = this;

    ctrl.controllerAction = function() {
        ctrl.jsonService(ctrl.service('account/collection/get'));
    };
}
getController.prototype = new ctrlFactory.get();



exports = module.exports = [getController];
