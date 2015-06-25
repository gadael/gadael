'use strict';

var ctrlFactory = require('restitute').controller;



function listController() {
    ctrlFactory.list.call(this, '/rest/manager/requests');

    this.controllerAction = function() {
        this.jsonService(this.service('manager/requests/list', { user: this.req.user._id }));
    };
}
listController.prototype = new ctrlFactory.list();


function getController() {
    ctrlFactory.get.call(this, '/rest/manager/requests/:id');

    this.controllerAction = function() {
        this.jsonService(this.service('manager/requests/get', { user: this.req.user._id }));
    };
}
getController.prototype = new ctrlFactory.get();



function updateController() {
    ctrlFactory.update.call(this, '/rest/manager/requests/:id');

    var controller = this;
    this.controllerAction = function() {

        // since service is query independant, we have to give
        // the additional parameter

        controller.jsonService(
            controller.service('manager/requests/save', {
                user: this.req.user._id
            })
        );
    };
}
updateController.prototype = new ctrlFactory.update();



exports = module.exports = {
    list: listController,
    get: getController,
    update: updateController
};
