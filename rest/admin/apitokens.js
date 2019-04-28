'use strict';

/**
 * Get/set oauth2 token on one user
 */

var ctrlFactory = require('restitute').controller;

function listController() {
    ctrlFactory.list.call(this, '/rest/admin/apitokens');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/apitokens/list'));
    };
}
listController.prototype = new ctrlFactory.list();


function getController() {
     ctrlFactory.get.call(this, '/rest/admin/apitokens/:id');

     this.controllerAction = function() {
         this.jsonService(this.service('admin/apitokens/get'));
     };
}
getController.prototype = new ctrlFactory.get();


function createController() {
    ctrlFactory.create.call(this, '/rest/admin/apitokens');
    this.controllerAction = function() {
        this.jsonService(this.service('admin/apitokens/save'));
    };
}
createController.prototype = new ctrlFactory.create();

function deleteController() {
    ctrlFactory.delete.call(this, '/rest/admin/apitokens/:id');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/apitokens/delete'));
    };
}
deleteController.prototype = new ctrlFactory.delete();

exports = module.exports = [
    listController,
    getController,
    createController,
    deleteController
];
