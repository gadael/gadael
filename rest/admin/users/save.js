'use strict';

var createController = require('../../controller').create;
var updateController = require('../../controller').update;

exports = module.exports = {
    create: new createController('/rest/admin/users'),
    update: new updateController('/rest/admin/users/:id')
};

/**
 * Call the save service for create and update controller
 */
function save() {
    var ctrl = this;
    
    var params = ctrl.req.body;
    if (ctrl.req.params.id) {
        params.id = ctrl.req.params.id;
    }
    
    var service = ctrl.service('admin/users/save');
    
    service.call(params).then(function(document) {
        ctrl.res.status(service.httpstatus).json(document);
        
    }).catch(function(err) {
        ctrl.res.status(service.httpstatus).json({ $outcome: service.outcome });
    });
}


exports.create.controllerAction = save;
exports.update.controllerAction = save;

