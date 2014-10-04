'use strict';

var listController = require('../../controller').list;


var controller = new listController('/rest/admin/collections/:id');
exports = module.exports = controller;

controller.controllerAction = function() {
    var ctrl = this;

    var service = ctrl.service('admin/collections/get');
    ctrl.jsonService(service);
    
};
