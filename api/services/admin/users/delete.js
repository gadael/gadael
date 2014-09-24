'use strict';

var deleteController = require('../../controller').delete;


var controller = new deleteController('/rest/admin/users/:id');
exports = module.exports = controller;

controller.controllerAction = function() {
    
    var ctrl = this;
    
    var gt = ctrl.req.app.utility.gettext;
    var workflow = ctrl.workflow;
    var User = ctrl.req.app.db.models.User;
    
    workflow.on('find', function() {
        User.findById(ctrl.req.params.id, function (err, document) {
            if (workflow.handleMongoError(err)) {
                workflow.document = document;
                workflow.emit('delete');
            }
        });
    });
    
    workflow.on('delete', function() {
        workflow.document.remove(function(err) {
            if (workflow.handleMongoError(err)) {
                workflow.success(gt.gettext('The user has been deleted'));
            }
        });
    });
    
    workflow.emit('find');
};
