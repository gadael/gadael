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
 * @param {User} user         The user document
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
        eventDocument.dtend = event.dtend;
        eventDocument.user = {
            id: user._id,
            name: user.getName()
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
 * @param {User} user                 The user document
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
                    id: user._id,
                    name: user.getName()
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
    var util = require('util');
    var Q = require('q');
    var deferred = Q.defer();
    var RightModel = service.app.db.models.Right;
    var AccountModel = service.app.db.models.Account;

    RightModel.findOne({ _id: elem.right })
        .exec(function(err, rightDocument) {

        if (!rightDocument) {
            return deferred.reject('failed to get right document from id '+elem.right);
        }

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
                        return deferred.reject(util.format('The quantity requests for right "%s" is not available', rightDocument.name));
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
 * @param {User} user             absence owner object
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
        chekedElementsPromises.push(checkElement(service, user._id, elem));
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
    var Q = require('q');

    if (undefined === distribution[0]) {
        return Q.fcall(function () {
            throw new Error('Invalid request, no distribution');
        });
    }

    if (undefined === distribution[0].event) {
        return Q.fcall(function () {
            throw new Error('Invalid request, event is not available in first right of distribution');
        });
    }

    if (undefined === distribution[distribution.length -1].event) {
        return Q.fcall(function () {
            throw new Error('Invalid request, event is not available in last right of distribution');
        });
    }

    dtstart = distribution[0].event.dtstart;
    dtend = distribution[distribution.length -1].event.dtend;

    return account.getValidCollectionForPeriod(dtstart, dtend, new Date());
}





/**
 * @param {apiService} service
 * @param {Object} params
 * @param {User} user
 * @return {Promise} promised fieldsToSet object
 */
function prepareRequestFields(service, params, user)
{
    var Q = require('q');
    var deferred = Q.defer();


    function getStepPromise(department)
    {
        var deferred = Q.defer();
        department.getManagers(function(err, managers) {
            if (err) {
                deferred.reject(err);
            }

            var step = {};
            step.operator = 'AND';
            step.department = department.name;
            step.approvers = [];
            for(var j=0; j< managers.length; j++) {
                step.approvers.push(managers[j].user.id);
            }

            deferred.resolve(step);

        });

        return deferred.promise;
    }



    /**
     * Get approval steps from the departments and ancestors
     * bypass steps with no approvers (departments without manager)
     *
     * @param {Array} departments
     * @return {Promise} resolve to the list of steps
     */
    function getApprovalSteps(departments)
    {

        var async =require('async');
        var Q = require('q');
        var deferred = Q.defer();
        var steps = [];


        async.eachSeries(departments, function iterator(department, callback) {

            getStepPromise(department).then(function addStep(step) {

                if (0 !== step.approvers.length) {
                    steps.push(step);
                }

                callback();
            }, callback);
        }, function done(err) {
            if (err) {
                return deferred.reject(err);
            }

            // set the first step in waiting status
            if (steps.length > 0) {
                steps[steps.length -1].status = 'waiting';
            }

            deferred.resolve(steps);
        });


        return deferred.promise;
    }



    user.getDepartmentsAncestors()
        .then(getApprovalSteps)
        .then(function(approvalSteps) {

        var account = user.roles.account;


        var fieldsToSet = {
            user: {
                id: params.user,
                name: account.user.name,
                department: user.department.name
            },
            approvalSteps: approvalSteps
        };

        if (undefined !== params.absence) {

            getCollectionFromDistribution(params.absence.distribution, account).then(function(collection) {

                var promisedDistribution = saveAbsence(service, user, params.absence, collection);

                promisedDistribution.then(function(distribution) {

                        fieldsToSet.events = [];

                        for(var d=0; d<distribution.length; d++) {
                            fieldsToSet.events.push(distribution[d].event);
                        }

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
                    event.request = requestDoc._id;
                    event.absenceElem = elem._id;
                    event.save();
                }
            }

        });


    }



    var UserModel = service.app.db.models.User;

    UserModel.findOne({
        '_id': params.user
    }).populate('roles.account').populate('department')
    .exec(function(err, user) {

        if (!user) {
            return service.error('User not found');
        }

        prepareRequestFields(service, params, user).then(function(fieldsToSet) {

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
                if (params.modifiedBy === undefined) {
                    return service.error('The modifiedBy parameter is missing');
                }

                RequestModel.findOne(filter, function(err, document) {
                    if (service.handleMongoError(err)) {

                        document.set(fieldsToSet);
                        document.addLog('modify', params.modifiedBy);
                        end(document, gt.gettext('The request has been modified'));
                    }
                });



            } else {

                if (params.createdBy === undefined) {
                    return service.error('The createdBy parameter is missing');
                }

                fieldsToSet.createdBy = {
                    id: params.createdBy._id,
                    name: params.createdBy.getName()
                };

                var document = new RequestModel();
                document.set(fieldsToSet);
                document.addLog('create', params.createdBy);

                end(document, gt.gettext('The request has been created'));
            }

        });

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


