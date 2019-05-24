'use strict';

var ctrlFactory = require('restitute').controller;

/**
 * Estimate the consumption for a request
 *
 * rest service parameters are:
 *  user
 *  selection
 *   - begin
 *   - end
 *  distribution: [{
 *    - right
 *       - id
 *       - renewal (optional)
 *    - quantity
 *    events: [{
 *          - dtstart
 *          - dtend
 *       }]
 *    }]
 *  collection
 *
 */
function getController() {
    ctrlFactory.get.call(this, '/rest/admin/consumption');
    var ctrl = this;

    // overwrite default method
    ctrl.method = 'post';

    ctrl.controllerAction = function() {
        ctrl.jsonService(ctrl.service('user/consumption/get'));
    };
}
getController.prototype = new ctrlFactory.get();

exports = module.exports = [getController];
