'use strict';

var createController = require('../../controller').create;
var updateController = require('../../controller').update;

exports = module.exports = {
    create: new createController('/rest/admin/collections'),
    update: new updateController('/rest/admin/collections/:id')
};

/**
 * Call the save service for create and update controller
 */
function save() {
    var ctrl = this;

    var service = ctrl.service('admin/collections/save');
    
    ctrl.jsonService(service);
}


exports.create.controllerAction = save;
exports.update.controllerAction = save;

