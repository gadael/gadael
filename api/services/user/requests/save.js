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
 *
 * @param {apiService} service
 * @param {String} user         The user ID
 * @param {AbsenceElem} elem
 * @param {object}     event
 *
 * @return {Promise}        Promise the AbsenceElem document, modified with the event ID
 */
function saveEvent(service, user, elem, event)
{
    var Q = require('q');
    var deferred = Q.defer();
    var EventModel = service.app.db.models.CalendarEvent;



    function fwdPromise(err, event)
    {
        if (err) {
            return deferred.reject(err);
        }

        elem.event = event._id;
        deferred.resolve(elem);
    }


    /**
     * Set event properties and save
     */
    function setProperties(eventDocument)
    {
        eventDocument.dtstart = event.dtstart;
        eventDocument.dtstart = event.dtend;
        eventDocument.user = {
            id: user,
            name: '?'
        };

        eventDocument.save(fwdPromise);
    }



    if (elem.event) {
        EventModel.findById(elem.event, function(err, existingEvent) {
            if (existingEvent) {
                setProperties(existingEvent);
            } else {
                setProperties(new EventModel());
            }
        });

        return deferred.promise;
    }


    // create new document

    var newEventDocument = new EventModel();
    setProperties(newEventDocument);

    return deferred.promise;
}


/**
 * This function will create or update an absence element
 *
 * @param {apiService}                  service
 * @param {String} user                 The user ID
 * @param {object} elem                 document
 *
 *
 * @return {Promise}        Promise the AbsenceElem document
 */
function saveElement(service, user, elem)
{
    var Q = require('q');
    var deferred = Q.defer();
    var ElementModel = service.app.db.models.AbsenceElem;
    var RightModel = service.app.db.models.Right;

    function setProperties(element)
    {
        element.quantity = elem.quantity;
        element.consumedQuantity = elem.consumedQuantity;

        RightModel.findOne({ _id: elem.right })
        .populate('type')
        .exec(function(err, rightDocument) {

            if (err) {
                return deferred.reject(err);
            }

            // get renewal to save in element
            rightDocument.getPeriodRenewal(elem.event.dtstart, elem.event.dtend).then(function(renewal) {

                if (null === renewal) {
                    return deferred.reject('No available renewal for the element');
                }


                element.right = {
                    id: elem.right,
                    name: rightDocument.name,
                    quantity_unit: rightDocument.quantity_unit,
                    renewal: {
                        id: renewal._id,
                        start: renewal.start,
                        finish: renewal.finish
                    }
                };

                if (undefined !== rightDocument.type) {
                    element.right.type = {
                        id: rightDocument.type._id,
                        name: rightDocument.type.name,
                        color: rightDocument.type.color
                    };
                }


                element.user = {
                    id: user,
                    name: '?'
                };



                saveEvent(service, user, element, elem.event).then(function(savedEvent) {


                    element.save(function(err, element) {
                        if (err) {
                            return deferred.reject(err);
                        }
                        deferred.resolve(element);
                    });
                });


            });
        });
    }


    if (elem._id) {
        // updated existing element
        ElementModel.findById(elem._id, function(err, existingElement) {
            if (elem) {
                setProperties(existingElement);
            } else {
                setProperties(new ElementModel());
            }
        });
        return deferred.promise;
    }

    // create new element
    setProperties(new ElementModel());
    return deferred.promise;
}





/**
 * Check element validity of one element
 * @return {Promise}
 */
function checkElement(service, user, elem)
{
    var Q = require('q');
    var deferred = Q.defer();
    var RightModel = service.app.db.models.Right;
    var AccountModel = service.app.db.models.Account;

    RightModel.findOne({ _id: elem.right })
        .exec(function(err, rightDocument) {

        // get renewal to save in element
        rightDocument.getPeriodRenewal(elem.event.dtstart, elem.event.dtend).then(function(renewal) {

            if (null === renewal) {
                return deferred.reject('No available renewal for the element');
            }



            AccountModel.findOne({ 'user.id': user  })
            .exec(function(err, accountDocument) {
                renewal.right = rightDocument;
                var accountRight = accountDocument.getAccountRight(renewal);

                accountRight.getAvailableQuantity().then(function(available) {

                    if (available < elem.quantity) {
                        return deferred.reject('The quantity requests for right %s is not available');
                    }

                    deferred.resolve(true);
                });


            });


        });

    });

    return deferred.promise;
}






/**
 * Save list of events
 *
 * @param {apiService} service
 * @param {String} user             absence owner object ID
 * @param {Object} params
 * @param {RightCollection} collection
 * @return {Promise} promised distribution array
 */
function saveAbsence(service, user, params, collection) {

    var Q = require('q');


    if (params.distribution === undefined || params.distribution.length === 0) {
        Q.fcall(function () {
            throw new Error('right distribution is mandatory to save an absence request');
        });
    }

    var i, elem,
        chekedElementsPromises = [],
        savedElementsPromises = [];

    // check available quantity

    for(i=0; i<params.distribution.length; i++) {
        elem = params.distribution[i];
        chekedElementsPromises.push(checkElement(service, user, elem));
    }

    return Q.all(chekedElementsPromises).then(function() {

        // save the events and create the elements documents

        for(i=0; i<params.distribution.length; i++) {
            elem = params.distribution[i];
            elem.consumedQuantity = collection.getConsumedQuantity(elem.quantity);
            savedElementsPromises.push(saveElement(service, user, elem));
        }

        return Q.all(savedElementsPromises);
    });
}


/**
 * Get the appliquable right collection of the user on the distribution period
 *
 * @param {Array} distribution posted parameter
 * @return {Promise} promise the rightCollection or null if the user has no right collection on the period
 *
 */
function getCollectionFromDistribution(distribution, account) {
    var dtstart, dtend;

    dtstart = distribution[0].event.dtstart;
    dtend = distribution[distribution.length -1].event.dtend;

    return account.getValidCollectionForPeriod(dtstart, dtend, new Date());
}





/**
 * @param {apiService} service
 * @param {Object} params
 * @return {Promise} promised fieldsToSet object
 */
function prepareRequestFields(service, params)
{
    var Q = require('q');
    var deferred = Q.defer();
    var UserModel = service.app.db.models.User;

    function getStepPromise(department)
    {
        var deferred = Q.defer();
        department.getManagers(function(err, managers) {
            if (err) {
                deferred.reject(err);
            }

            var step = {};
            step.operator = 'AND';
            step.approvers = [];
            for(var j=0; j< managers.length; j++) {
                step.approvers.push(managers[j].user.id);
            }

            deferred.resolve(step);

        });

        return deferred.promise;
    }



    /**
     * @param {Array} departments
     * @return {Promise} resolve to the list of steps
     */
    function getApprovalSteps(departments)
    {


        var Q = require('q');
        var promises = [];

        for(var i=0; i< departments.length; i++) {

            promises.push(getStepPromise(departments[i]));
        }

        return Q.all(promises);
    }


    UserModel.findOne({
        '_id': params.user
    }).populate('roles.account')
    .exec(function(err, user) {

        user.getDepartmentsAncestors()
            .then(getApprovalSteps)
            .then(function(approvalSteps) {

            var account = user.roles.account;


            var fieldsToSet = {
                user: {
                    id: params.user,
                    name: account.user.name
                },
                approvalSteps: approvalSteps
            };

            if (undefined !== params.absence) {

                getCollectionFromDistribution(params.absence.distribution, account).then(function(collection) {

                    var promisedDistribution = saveAbsence(service, params.user, params.absence, collection);

                    promisedDistribution.then(function(distribution) {


                            fieldsToSet.absence = {
                                distribution: distribution
                            };

                            if (null !== collection) {
                                fieldsToSet.absence.rightCollection = collection._id;
                            }

                            deferred.resolve(fieldsToSet);

                    }, service.error);

                });
            }

            if (undefined !== params.time_saving_deposit) {
                fieldsToSet.time_saving_deposit = params.time_saving_deposit;
                deferred.resolve(fieldsToSet);
            }

            if (undefined !== params.workperiod_recover) {
                fieldsToSet.workperiod_recover = params.workperiod_recover;
                deferred.resolve(fieldsToSet);
            }


        });

    });

    return deferred.promise;
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
    var AbsenceElemModel = service.app.db.models.AbsenceElem;
    
    /**
     * Update link to absences elements in the linked events
     * @param {Request} requestDoc
     */
    function saveEmbedEvents(requestDoc)
    {
        var elem, event;

        if (requestDoc.absence === undefined) {
            return;
        }

        AbsenceElemModel.find().where('id').in(requestDoc.absence.distribution)
            .populate('event')
            .exec(function(err, elements) {

            if (err) {
                return console.log(err);
            }


            for( var i=0; i<elements.length; i++) {

                elem = elements[i];
                event = elem.event;

                if (event.absenceElem !== elem._id) {
                    event.absenceElem = elem._id;
                    event.save();
                }
            }

        });


    }




    prepareRequestFields(service, params).then(function(fieldsToSet) {

        var filter = {
            _id: params.id,
            deleted: false
        };

        filter['user.id'] = params.user;


        function end(document, message)
        {
            document.save(function(err, document) {
                if (service.handleMongoError(err)) {
                    saveEmbedEvents(document);

                    // Do not wait for event update?
                    service.resolveSuccess(
                        document,
                        message
                    );
                }
            });
        }



        if (params.id)
        {


            RequestModel.findOne(filter, function(err, document) {
                if (service.handleMongoError(err)) {

                    document.set(fieldsToSet);
                    end(document, gt.gettext('The request has been modified'));
                }
            });



        } else {

            fieldsToSet.createdBy = {
                id: params.createdBy._id,
                name: params.createdBy.getName()
            };


            var document = new RequestModel();
            document.set(fieldsToSet);
            end(document, gt.gettext('The request has been created'));
        }

    });
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


