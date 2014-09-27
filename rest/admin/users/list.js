'use strict';

var listController = require('../../controller').list;


var controller = new listController('/rest/admin/users');
exports = module.exports = controller;


/**
 * Controller for admin users list
 */
controller.controllerAction = function() {
    
    var ctrl = this;

    var service = ctrl.service('admin/users/list');
    
    /**
     * Call the admin uses list service with pagniation function
     */
    service.call(ctrl.req.query, ctrl.paginate).then(function(docs) {
        ctrl.res.status(service.httpstatus).json(docs);
        
    }).catch(function(err) {
        ctrl.res.status(service.httpstatus).json({ $outcome: service.outcome });
    });

};
