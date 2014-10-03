'use strict';

var getController = require('../../controller').get;


var controller = new getController('/rest/admin/users/:id');
exports = module.exports = controller;

controller.controllerAction = function() {
    var ctrl = this;

    
    var service = ctrl.service('admin/users/get');
    
    
    service.call(ctrl.req.params).then(function(document) {
        ctrl.res.status(service.httpstatus).json(document);
        
    }).catch(function(err) {
        ctrl.res.status(service.httpstatus).json({ $outcome: service.outcome });
    });
};
