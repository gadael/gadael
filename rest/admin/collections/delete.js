'use strict';

var deleteController = require('../../controller').delete;


var controller = new deleteController('/rest/admin/collections/:id');
exports = module.exports = controller;

controller.controllerAction = function() {
    
    var ctrl = this;
    
    var service = ctrl.service('admin/collections/delete');
    ctrl.jsonService(service);
};
