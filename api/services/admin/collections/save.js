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

    if (undefined !== params.businessDays) {
        // ensure at least one business day in week

        if (!hasOneBusinessDay()) {
            service.error(gt.gettext('At least one business day is required'));
        }
    }


    if (service.needRequiredFields(params, ['name'])) {
        return;
    }

    saveCollection(service, params);
}
    
    
/**
 * Update/create the collection document
 * 
 * @param {apiService} service
 * @param {Object} params
 */  
function saveCollection(service, params) {

    const gt = require('./../../../../modules/gettext');

    
    var RightCollection = service.app.db.models.RightCollection;

    if (params.id)
    {
        RightCollection.findById(params.id, function (err, document) {
            if (service.handleMongoError(err))
            {
                document.name = params.name;

                if (params.attendance !== undefined) {
                    document.attendance = params.attendance;
                }
                
                if (params.businessDays !== undefined) {
                    document.businessDays = params.businessDays;
                }

                document.save(function (err) {
                    if (service.handleMongoError(err)) {
                        
                        service.resolveSuccess(
                            document, 
                            gt.gettext('The collection has been modified')
                        );
                    }
                });
            }
        });

    } else {

        var newObj = {
            name: params.name
        };

        if (params.attendance !== undefined) {
            newObj.attendance = params.attendance;
        }

        RightCollection.create(newObj, function(err, document) {
            if (service.handleMongoError(err))
            {
                service.resolveSuccess(
                    document, 
                    gt.gettext('The collection has been created')
                );
            }
        });
    }
}
    



exports = module.exports = function(services, app) {
    
    var service = new services.save(app);
    
    /**
     * Call the collection save service
     * 
     * @param {Object} params
     *
     * @return {Query}
     */
    service.getResultPromise = function(params) {
        validate(service, params);
        return service.deferred.promise;
    };
    
    
    return service;
};


