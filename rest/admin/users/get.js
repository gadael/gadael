'use strict';

var listController = require('../../controller').list;


var controller = new listController('/rest/admin/users/:id');
exports = module.exports = controller;

controller.controllerAction = function() {
    var ctrl = this;
    
    var service = require('../../../api/services/admin/users/get')(ctrl.req.app);
    
    
    service.call(ctrl.req.params).then(function(user) {
        ctrl.res.json(user);
    }).catch(function(err) {
        ctrl.res.json(service.outcome);
    });
    
};
