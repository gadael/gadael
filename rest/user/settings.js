'use strict';



var ctrlFactory = require('restitute').controller;


function getController() {
    ctrlFactory.get.call(this, '/rest/user/settings');

    this.controllerAction = function() {
        this.jsonService(this.service('user/settings/get', { user: this.req.user.id }));
    };
}
getController.prototype = new ctrlFactory.get();





function updateController() {
    ctrlFactory.update.call(this, '/rest/user/settings');

    var controller = this;
    this.controllerAction = function() {

        // since service is query independant, we have to give
        // the additional parameter

        controller.jsonService(
            controller.service('user/settings/save', {
                user: controller.req.user._id,
                modifiedBy: controller.req.user
            })
        );
    };
}


exports = module.exports = [
    getController,
    updateController
];
