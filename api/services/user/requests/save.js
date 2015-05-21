'use strict';



/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params)
{

    if (service.needRequiredFields(params, ['user'])) {
        return;
    }

    saveRequest(service, params);
}


/**
 * This function will create or update an event
 * dtstart and dtend will be guessed from the quantity, user working times schedule and non working time periods
 *
 * @param {apiService} service
 * @param {String} user     The user ID
 * @param {Object} elem     an object to create or update a Request_AbsenceElem document
 *                          the object can contain an "event" property with the event id to update the existing document
 *
 * @return {Promise}        Promise the event ID to save in absence element
 */
function saveEvent(service, user, elem)
{
    var Q = require('q');
    var deferred = Q.deferr();
    var EventModel = service.app.db.models.Event;



    function fwdPromise(err, event)
    {
        if (err) {
            return deferred.reject(err);
        }
        deferred.resolve(event._id);
    }


    /**
     * Set event properties and save
     */
    function setProperties(event)
    {
        event.save(fwdPromise);
    }



    if (elem.event) {
        EventModel.findById(elem.event, function(err, event) {
            setProperties(event);

        });

        return deferred.promise;
    }


    // create new document

    var event = new EventModel();
    setProperties(event);

    return deferred.promise;
}



/**
 * @param {apiService} service
 * @param {Object} params
 * @return {Object}
 */
function saveAbsence(service, params) {

    if (params.distribution === undefined || params.distribution.length === 0) {
        throw new Error('right distribution is mandatory to save an absence request');
    }

    var elem, event;
    for(var i=0; i<params.distribution.length; i++) {
        elem = params.distribution[i];
        event = elem.event;
    }

    return {
        distribution: []
    };
}

    
    
/**
 * Update/create the request document
 * 
 * @param {apiService} service
 * @param {Object} params
 */  
function saveRequest(service, params) {

    var Gettext = require('node-gettext');
    var gt = new Gettext();

    
    var RequestModel = service.app.db.models.Request;
    
    
    var fieldsToSet = { 
        user: params.user
    };
    
    try {
        if (undefined !== params.absence) {
            fieldsToSet.absence = saveAbsence(service, params.absence);
        } else if (undefined !== params.time_saving_deposit) {
            fieldsToSet.time_saving_deposit = params.time_saving_deposit;
        } else if (undefined !== params.workperiod_recover) {
            fieldsToSet.workperiod_recover = params.workperiod_recover;
        }
    } catch(e) {
        return service.error(e.message);
    }

    var filter = {
        _id: params.id,
        deleted: false
    };

    filter['user.id'] = params.user;

    

    if (params.id)
    {
        RequestModel.findOneAndUpdate(filter, fieldsToSet, function(err, document) {
            if (service.handleMongoError(err))
            {
                service.resolveSuccess(
                    document, 
                    gt.gettext('The request has been modified')
                );
            }
        });

    } else {
        
        fieldsToSet.createdBy = params.createdBy;

        RequestModel.create(fieldsToSet, function(err, document) {

            if (service.handleMongoError(err))
            {
                service.resolveSuccess(
                    document, 
                    gt.gettext('The request has been created')
                );
            }
        });
    }
}
    
    

    
    
    
    



/**
 * Construct the type save service
 * @param   {object}          services list of base classes from apiService
 * @param   {express|object}  app      express or headless app
 * @returns {saveItemService}
 */
exports = module.exports = function(services, app) {
    
    var service = new services.save(app);
    
    /**
     * Call the right type save service
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


