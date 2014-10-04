'use strict';

var listController = require('../../controller').list;


var controller = new listController('/rest/admin/collections');
exports = module.exports = controller;


/**
 * Controller for admin users list
 */
controller.controllerAction = function() {
    
    var ctrl = this;

    var service = ctrl.service('admin/collections/list');
    
    ctrl.jsonService(service);
};
