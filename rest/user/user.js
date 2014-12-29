'use strict';

var ctrlFactory = require('restitute').controller;


function getController() {
    ctrlFactory.get.call(this, '/rest/user');
    var ctrl = this;

    this.controllerAction = function() {

        var gt = ctrl.req.app.utility.gettext;

        if (!ctrl.req.user) {
            return ctrl.accessDenied(gt.gettext('You must be logged in'));
        }

        ctrl.res.status(200).json(ctrl.req.user);
    };
}
getController.prototype = new ctrlFactory.get();



exports = module.exports = {
    get: getController
};
