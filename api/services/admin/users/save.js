'use strict';

var createController = require('../../controller').create;
var updateController = require('../../controller').update;

exports = module.exports = {
    create: new createController('/rest/admin/users'),
    update: new updateController('/rest/admin/users/:id')
};


function save() {
    var ctrl = this;
    
    
    var gt = ctrl.req.app.utility.gettext;
    var workflow = ctrl.workflow;
    var User = ctrl.models.User;
    var req = ctrl.req;
    
    workflow.on('validate', function() {

        if (workflow.needRequiredFields(['firstname', 'lastname',  'email'])) {
          return workflow.emit('response');
        }

        workflow.emit('save');
    });
    
    
    /**
     * Update/create the user document
     */  
    workflow.on('save', function() {

        if (req.params.id)
        {
            User.findById(req.params.id, function (err, user) {
                if (workflow.handleMongoError(err))
                {
                    user.firstname 	= req.body.firstname;
                    user.lastname 	= req.body.lastname;
                    user.email 		= req.body.email;
                    user.department = req.body.department;
                    user.isActive   = req.body.isActive;
                    
                    user.save(function (err) {
                        if (workflow.handleMongoError(err)) {

                            workflow.document = user;
                        
                            workflow.outcome.alert.push({
                                type: 'success',
                                message: gt.gettext('The user has been modified')
                            });
                            
                            workflow.emit('saveRoles');
                        }
                    });
                }
            });
            
        } else {
            
            User.create({
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                department: req.body.department,
                password: req.body.newpassword,
                isActive: req.body.isActive 
            }, function(err, user) {
                
                if (workflow.handleMongoError(err))
                {
                    workflow.document = user;
                    
                    workflow.outcome.alert.push({
                        type: 'success',
                        message: gt.gettext('The user has been created')
                    });

                    workflow.emit('saveRoles');
                }
            });
        }
    });
    
    
    
    workflow.on('saveRoles', function() {
        
        if (!workflow.document)
        {
            return workflow.emit('exception', 'No user document to save roles on');
        }
        
        var saveRoles = require('../../../modules/roles');
        
        var account = null;
        if (req.body.isAccount) {
            account = {
                nonWorkingDays: req.body.roles.account.nonWorkingDays,
                workschedule: req.body.roles.account.workschedule
            };
        }
        
        var admin = req.body.isAdmin ? {} : null;
        var manager = req.body.isManager ? {} : null;
        
        
        saveRoles(
            req.app.db.models, 
            workflow.document, 
            account, 
            admin, 
            manager, 
            function updateUserWithSavedRoles(err, results) {

                if (workflow.handleMongoError(err)) { // error forwarded by async
                    
                    workflow.document.save(function(err) {
                        if (workflow.handleMongoError(err)) { // error for user document
                            workflow.emit('response');
                        }
                    });
                }
            }
        );
    });
    
    
    
    workflow.emit('validate');
}


exports.create.controllerAction = save;
exports.update.controllerAction = save;

