'use strict';

var ctrlFactory = require('restitute').controller;

/**
 * Download export file
 *
 * rest service parameters are:
 *  format xlsx|sage|csv...
 *  type balance|requests
 *  from
 *  to
 *  moment
 */
function getController() {
    ctrlFactory.get.call(this, '/rest/admin/export');
    var ctrl = this;

    ctrl.controllerAction = function() {
        ctrl.jsonService(ctrl.service('admin/export/get'));
    };
}
getController.prototype = new ctrlFactory.get();



exports = module.exports = {
    get: getController
};
