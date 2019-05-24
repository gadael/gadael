'use strict';

var ctrlFactory = require('restitute').controller;



function listController() {
    ctrlFactory.list.call(this, '/rest/admin/waitingrequests');

    this.controllerAction = function() {
        this.jsonService(this.service('manager/waitingrequests/list'));
    };
}
listController.prototype = new ctrlFactory.list();


function getController() {
    ctrlFactory.get.call(this, '/rest/admin/waitingrequests/:id');

    this.controllerAction = function() {
        this.jsonService(this.service('manager/waitingrequests/get'));
    };
}
getController.prototype = new ctrlFactory.get();


/**
 * Confirm or reject a waiting request instead of a manager
 */
function updateController() {
    ctrlFactory.update.call(this, '/rest/admin/waitingrequests/:id');

    var controller = this;
    this.controllerAction = function() {
        controller.jsonService(
            controller.service('manager/waitingrequests/save')
        );
    };
}
updateController.prototype = new ctrlFactory.update();



exports = module.exports = [
    listController,
    getController,
    updateController
];
