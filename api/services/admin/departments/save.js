'use strict';



const gt = require('./../../../../modules/gettext');



/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

    function hasOneBusinessDay() {
        for (let d in params.businessDays) {
            if (params.businessDays.hasOwnProperty(d)) {
                if (params.businessDays[d]) {
                    return true;
                }
            }
        }

        return false;
    }


    if (service.needRequiredFields(params, ['name'])) {
        return;
    }

    if (undefined !== params.businessDays) {
        // ensure at least one business day in week

        if (!hasOneBusinessDay()) {
            service.error(gt.gettext('At least one business day is required'));
        }
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
    



    var DepartmentModel = service.app.db.models.Department;
    
    var fieldsToSet = { 
        name: params.name,
        operator: params.operator
    };

    if (params.businessDays) {
        fieldsToSet.businessDays = params.businessDays;
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
                        service.resolveSuccess(
                            document,
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
                service.resolveSuccess(
                    document, 
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


