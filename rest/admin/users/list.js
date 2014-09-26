'use strict';

var listController = require('../../controller').list;


var controller = new listController('/rest/admin/users');
exports = module.exports = controller;

controller.controllerAction = function() {
    
    var ctrl = this;

    var service = ctrl.service('admin/users/list');
    
    
    service.call(ctrl.req.params, ctrl.paginate).then(function(docs) {
        ctrl.res.status(service.httpstatus).json(docs);
        
    }).catch(function(err) {
        ctrl.res.status(service.httpstatus).json({ $outcome: service.outcome });
    });

};


