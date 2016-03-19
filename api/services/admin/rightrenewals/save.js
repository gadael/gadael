'use strict';


var Gettext = require('node-gettext');
var gt = new Gettext();


/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

    if (service.needRequiredFields(params, ['right', 'start', 'finish'])) {
        return;
    }

    if (params.start >= params.finish) {
        return service.error(gt.gettext('Finish date must be greater than start date'));
    }

    saveRenewal(service, params);
}
    
    
/**
 * Update/create the right renewal document
 * 
 * @param {apiService} service
 * @param {Object} params
 */  
function saveRenewal(service, params) {


    var RightRenewalModel = service.app.db.models.RightRenewal;
    
    
    var fieldsToSet = { 
        right: params.right, 
        start: params.start,
        finish: params.finish,
        lastUpdate: new Date()  
    };
    
    
    
    

    if (params.id)
    {
        RightRenewalModel.findOne({ _id: params.id }, function(err, document) {
            if (service.handleMongoError(err))
            {
                document.set(fieldsToSet);
                document.adjustments = document.adjustments.filter(function(a) {
                    return (null !== a.quantity);
                });

                document.save(function(err, document) {

                    if (service.handleMongoError(err)) {

                        service.resolveSuccess(
                            document,
                            gt.gettext('The right renewal period has been modified')
                        );

                    }

                });


            }
        });

    } else {

        var document = new RightRenewalModel();
        document.set(fieldsToSet);
        document.save(function(err, document) {

            if (service.handleMongoError(err))
            {
                service.resolveSuccess(
                    document, 
                    gt.gettext('The right renewal period has been created')
                );
            }
        });
    }
}
    
    

    
    
    
    



/**
 * Construct the right renewal save service
 * @param   {object}          services list of base classes from apiService
 * @param   {express|object}  app      express or headless app
 * @returns {saveItemService}
 */
exports = module.exports = function(services, app) {
    
    var service = new services.save(app);
    
    /**
     * Call the right renewal save service
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


