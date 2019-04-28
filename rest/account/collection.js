'use strict';

var ctrlFactory = require('restitute').controller;

/**
 * Get the collection for a user account
 * according to a date interval
 * This is collection object to use when creating a vacation request
 *
 * rest service parameters are:
 *  dtstart
 *  dtend
 *
 */
function getController() {
    ctrlFactory.get.call(this, '/rest/account/collection');
    var ctrl = this;

    ctrl.controllerAction = function() {

        // if not allowed to spoof the user request creation, force the user parameter

        var spoofed_user = ctrl.req.query.user;
        var forced_params = null;

        if (!spoofed_user || !ctrl.req.user.canSpoofUser(spoofed_user)) {
            forced_params = { user: ctrl.req.user._id };
        }

        ctrl.jsonService(ctrl.service('account/collection/get', forced_params));
    };
}
getController.prototype = new ctrlFactory.get();



exports = module.exports = [getController];
