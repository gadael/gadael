'use strict';

var listController = require('../../controller').list;


var controller = new listController('/rest/admin/users/:id');
exports = module.exports = controller;

controller.controllerAction = function() {
    var ctrl = this;

    
    var service = ctrl.service('admin/users/get');
    
    
    service.call(ctrl.req.params).then(function(user) {
        ctrl.res.status(service.httpstatus).json(user);
        
    }).catch(function(err) {
        ctrl.res.status(service.httpstatus).json({ $outcome: service.outcome });
    });
};
