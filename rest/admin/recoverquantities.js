'use strict';

var ctrlFactory = require('restitute').controller;



function listController() {
    ctrlFactory.list.call(this, '/rest/admin/recoverquantities');

    this.controllerAction = function() {
        this.jsonService(this.service('user/recoverquantities/list'));
    };
}
listController.prototype = new ctrlFactory.list();


function getController() {
    ctrlFactory.get.call(this, '/rest/admin/recoverquantities/:id');

    this.controllerAction = function() {
        this.jsonService(this.service('user/recoverquantities/get'));
    };
}
getController.prototype = new ctrlFactory.get();



function createController() {
    ctrlFactory.create.call(this, '/rest/admin/recoverquantities');

    var controller = this;
    this.controllerAction = function() {

        // since service is query independant, we have to give
        // the additional parameter

        controller.jsonService(
            controller.service('user/recoverquantities/save', {
                createdBy: controller.req.user,
                modifiedBy: controller.req.user
            })
        );
    };
}
createController.prototype = new ctrlFactory.create();



function updateController() {
    ctrlFactory.update.call(this, '/rest/admin/recoverquantities/:id');

    var controller = this;
    this.controllerAction = function() {

        // since service is query independant, we have to give
        // the additional parameter

        controller.jsonService(
            controller.service('user/recoverquantities/save', {
                modifiedBy: controller.req.user
            })
        );
    };
}
updateController.prototype = new ctrlFactory.update();

function deleteController() {
    ctrlFactory.delete.call(this, '/rest/admin/recoverquantities/:id');

    var controller = this;
    this.controllerAction = function() {
        this.jsonService(this.service('user/recoverquantities/delete', {
            deletedBy: controller.req.user
        }));
    };
}
deleteController.prototype = new ctrlFactory.delete();



exports = module.exports = [
    listController,
    getController,
    createController,
    updateController,
    deleteController
];
