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
        //if (workflow.handleMongoError(err)) {
            noRoleCallback();
        //}
    });

};




function updateRole(role, roleProperties)
{

    for(var pname in roleProperties) {
        if (roleProperties.hasOwnProperty(pname)) {
            role[pname] = roleProperties[pname];
        }
    }

    return role;
}




/**
 * Get async task for account role
 *
 * @param object    models
 * @param object    userDocument
 * @param object    roleProperties
 *
 * @return function
 */
var asyncAccountTask = function(models, userDocument, roleProperties) {

    var checkedRole = (null !== roleProperties);

    return function(asyncTaskEnd) {

        removeOrUpdate(userDocument, checkedRole, models.Account, function(role) {

            updateRole(role, roleProperties).save(
                function(err) {
                    if (err) {
                        asyncTaskEnd(err);
                        return;
                    }

                    userDocument.roles.account = role._id;
                    asyncTaskEnd(null, 'account');
                    role.saveLunchBreaks();
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
 * @param object    roleProperties
 *
 * @return function
 */
var asyncAdminTask = function(models, userDocument, roleProperties) {

    var checkedRole = (null !== roleProperties);

    return function(asyncTaskEnd) {

        removeOrUpdate(userDocument, checkedRole, models.Admin, function(role) {

            updateRole(role, roleProperties).save(
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
 * @param object    roleProperties
 *
 * @return function
 */
var asyncManagerTask = function(models, userDocument, roleProperties) {

    var checkedRole = (null !== roleProperties);

    return function(asyncTaskEnd) {

        removeOrUpdate(userDocument, checkedRole, models.Manager, function(role) {

            updateRole(role, roleProperties).save(
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
            userDocument.roles.manager = undefined;
            asyncTaskEnd(null, 'manager');
        });
    };
};




/**
 * Process an async task for the 3 roles
 *
 * @param   object models
 * @param   object userDocument
 *
 * @param   object account          If null, unset role, object contain property to set in role
 * @param   object admin            If null, unset role, object contain property to set in role
 * @param   object manager          If null, unset role, object contain property to set in role
 *
 * @param   function callback       Async task callback
 */
exports = module.exports = function(models, userDocument, account, admin, manager, callback){

    require('async').parallel([
        asyncAccountTask(models, userDocument, account),
        asyncAdminTask(models, userDocument, admin),
        asyncManagerTask(models, userDocument, manager)
    ], callback);
};
