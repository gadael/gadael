'use strict';

var ctrlFactory = require('restitute').controller;

/**
 * Get the collection for a user account
 * according to a date interval
 * This is collection object to use when creating a vacation request
 */
function getController() {
    ctrlFactory.get.call(this, '/rest/account/collection');
    var ctrl = this;

    this.controllerAction = function() {

    };
}
getController.prototype = new ctrlFactory.get();



exports = module.exports = {
    get: getController
};
