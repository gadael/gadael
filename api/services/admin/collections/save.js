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

    let fieldsToSet = {
        name: params.name
    };


    if (params.attendance !== undefined) {
        fieldsToSet.attendance = params.attendance;
    }

    if (params.businessDays !== undefined) {
        fieldsToSet.businessDays = params.businessDays;
    }

    if (params.workedDays !== undefined) {
        fieldsToSet.workedDays = params.workedDays;
    }


    let RightCollection = service.app.db.models.RightCollection;

    if (params.id)
    {
        RightCollection.findById(params.id, function (err, document) {
            if (service.handleMongoError(err))
            {
                document.set(fieldsToSet);

                document.save(function (err) {
                    if (service.handleMongoError(err)) {

                        service.resolveSuccessGet(
                            document._id,
                            gt.gettext('The collection has been modified')
                        );
                    }
                });
            }
        });

    } else {

        let collection = new RightCollection();
        collection.set(fieldsToSet);

        collection.save(function(err, document) {
            if (service.handleMongoError(err))
            {
                service.resolveSuccessGet(
                    document._id,
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
