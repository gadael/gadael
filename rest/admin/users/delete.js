'use strict';

var deleteController = require('../../controller').delete;


var controller = new deleteController('/rest/admin/users/:id');
exports = module.exports = controller;

controller.controllerAction = function() {
    
    var ctrl = this;
    
    var service = ctrl.service('admin/users/delete');
    
    
    service.call(ctrl.req.params.id).then(function(user) {
        ctrl.res.status(service.httpstatus).json(user);
        
    }).catch(function(err) {
        ctrl.res.status(service.httpstatus).json({ $outcome: service.outcome });
    });
};
