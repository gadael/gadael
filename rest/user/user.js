'use strict';

var ctrlFactory = require('restitute').controller;


function getController() {
    ctrlFactory.get.call(this, '/rest/user');
    var ctrl = this;

    this.controllerAction = function() {

        var gt = ctrl.req.app.utility.gettext;

        if (!ctrl.req.isAuthenticated()) {
            return ctrl.accessDenied(gt.gettext('You must be logged in'));
        }

        require('../../modules/userComplete')(ctrl.req.user).then(function(userObj) {
            ctrl.res.status(200).json(userObj);
        });

    };
}
getController.prototype = new ctrlFactory.get();



exports = module.exports = [
    getController
];
