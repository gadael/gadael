'use strict';




/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {



    if (service.needRequiredFields(params, ['name'])) {
        return;
    }


    saveDepartment(service, params);
}


/**
 * Update/create the department document
 *
 * @param {apiService} service
 * @param {Object} params
 */
function saveDepartment(service, params) {

    const gt = service.app.utility.gettext;


    var DepartmentModel = service.app.db.models.Department;

    var fieldsToSet = {
        name: params.name,
        minActiveUsers: params.minActiveUsers
    };

    if (params.operator) {
        fieldsToSet.operator = params.operator;
    }

    if (params.parent) {
        fieldsToSet.parent = params.parent._id;
    }


    if (params.id)
    {
        DepartmentModel.findOne({ _id: params.id }, function(err, document) {
            if (service.handleMongoError(err)) {
                document.set(fieldsToSet);
                document.save(function(err, document) {
                    if (service.handleMongoError(err)) {
                        service.resolveSuccessGet(
                            document._id,
                            gt.gettext('The department has been modified')
                        );
                    }
                });


            }
        });

    } else {

        var document = new DepartmentModel();
        document.set(fieldsToSet);
        document.save(function(err, document) {
            if (service.handleMongoError(err))
            {
                service.resolveSuccessGet(
                    document._id,
                    gt.gettext('The department has been created')
                );
            }
        });
    }
}










/**
 * Construct the department save service
 * @param   {object}          services list of base classes from apiService
 * @param   {express|object}  app      express or headless app
 * @returns {saveItemService}
 */
exports = module.exports = function(services, app) {

    var service = new services.save(app);

    /**
     * Call the department save service
     *
     * @param {Object} params
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        validate(service, params);
        return service.deferred.promise;
    };


    return service;
};
