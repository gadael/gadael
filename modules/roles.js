'use strict';


/**
 * Remove or update a role for one user
 */  
var removeOrUpdate = function(userDocument, checkedRole, model, updateCallback, noRoleCallback) {
    
    var promise = model.find({ 'user.id': userDocument._id }).exec();
    
    promise.then(function(roles) {
        
        if (0 === roles.length) {
            
            if (checkedRole) {
                var role = new model();
                role.user = {
                    id: userDocument._id,
                    name: userDocument.lastname+' '+userDocument.firstname
                };

                updateCallback(role);
                return;
            }
            
        } else if (1 <= roles.length) {
            
            if (checkedRole) {
                updateCallback(roles[0]);
                return;
            } else {
                roles.forEach(function(role) { 
                    role.remove();
                });
            }
        }
        
        noRoleCallback();
        
        
    }, function (err) {
        if (workflow.handleMongoError(err)) {
            noRoleCallback();
        }
    });

};



/**
 * Get async task for account role
 * 
 * @param object    models
 * @param object    userDocument
 * @param boolean   checkedRole     TRUE if user must be set account
 * 
 * @return function
 */
var asyncAccountTask = function(models, userDocument, checkedRole) {
    
    return function(asyncTaskEnd) {
        
        
    
        removeOrUpdate(userDocument, checkedRole, models.Account, function(role) {

            role.save(
                function(err) {
                    if (err) {
                        asyncTaskEnd(err);
                        return;
                    }
                    
                    userDocument.roles.account = role._id;
                    asyncTaskEnd(null, 'account');
                }
            );
        }, function() {
            userDocument.roles.account = undefined;
            asyncTaskEnd(null, 'account');
        });
    };
};







/**
 * Get async task for admin role
 * 
 * @param object    models
 * @param object    userDocument
 * @param boolean   checkedRole     TRUE if user must be set admin
 * 
 * @return function
 */
var asyncAdminTask = function(models, userDocument, checkedRole) {
    
    return function(asyncTaskEnd) {
    
        removeOrUpdate(userDocument, checkedRole, models.Admin, function(role) {

            role.save(
                function(err) {
                    if (err) {
                        asyncTaskEnd(err);
                        return;
                    }
                    
                    userDocument.roles.admin = role._id;
                    asyncTaskEnd(null, 'admin');
                }
            );
        }, function() {
            userDocument.roles.admin = undefined;
            asyncTaskEnd(null, 'admin');
        });
    };
};







/**
 * Get async task for manager role
 * 
 * @param object    models
 * @param object    userDocument
 * @param boolean   checkedRole     TRUE if user must be set manager
 * 
 * @return function
 */
var asyncManagerTask = function(models, userDocument, checkedRole) {
    
    return function(asyncTaskEnd) {
    
        removeOrUpdate(userDocument, checkedRole, models.Manager, function(role) {

            role.save(
                function(err) {
                    if (err) {
                        asyncTaskEnd(err);
                        return;
                    }
                    
                    userDocument.roles.manager = role._id;
                    asyncTaskEnd(null, 'manager');
                }
            );
        }, function() {
            userDocument.roles.admin = undefined;
            asyncTaskEnd(null, 'manager');
        });
    };
};




/**
 * Process an async task for the 3 roles
 * 
 */
exports = module.exports = function(models, userDocument, isAccount, isAdmin, isManager, callback) {
    
    require('async').parallel([
        asyncAccountTask(models, userDocument, isAccount),
        asyncAdminTask(models, userDocument, isAdmin),
        asyncManagerTask(models, userDocument, isManager)
    ], callback);
};
