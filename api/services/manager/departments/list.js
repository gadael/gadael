'use strict';


/**
 * The manager managed departments list
 */







exports = module.exports = function(services, app) {

    var service = new services.list(app);

    var userModel = service.app.db.models.User;
    var departmentModel = service.app.db.models.Department;



    /**
     * Call the requests list service
     *
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params, paginate) {

        var find = userModel.findOne({ _id: params.user });
        find.populate('roles.manager');
        find.exec(function(err, user) {
            if (service.handleMongoError(err)) {
                var departments = user.roles.manager.department;

                if (undefined === departments || null === departments || 0 === departments.length) {
                    return service.error('No managed departments');
                }

                departmentModel.find().where('_id').in(departments).exec(function(err, docsObj) {
                    service.mongOutcome(err, docsObj);
                });
            }
        });

        return service.deferred.promise;
    };


    return service;
};
