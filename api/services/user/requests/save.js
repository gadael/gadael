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
 * @param {apiService}  service
 * @param {User}        user         The user document
 * @param {AbsenceElem} elem
 * @param {array}       events       array of objects
 *
 * @return {Promise}        Promise the AbsenceElem document, modified with the events ID
 */
function saveEvents(service, user, elem, events)
{
    var async = require('async');
    var Q = require('q');
    var deferred = Q.defer();
    var EventModel = service.app.db.models.CalendarEvent;




    /**
     * Set event properties and save
     * @param {CalendarEvent} eventDocument
     * @param {object} event
     * @param {function} callback
     */
    function setProperties(eventDocument, event, callback)
    {
        if (undefined === elem.right.type) {
            eventDocument.summary = elem.right.name;
        } else {
            eventDocument.summary = elem.right.type.name;
        }

        eventDocument.dtstart = event.dtstart;
        eventDocument.dtend = event.dtend;
        eventDocument.user = {
            id: user._id,
            name: user.getName()
        };

        eventDocument.save(function(err, savedEvent) {
            if (err) {
                return callback(err);
            }

            if (undefined === savedEvent._id || null === savedEvent._id) {
                throw new Error('Unexpected value');
            }

            elem.events.push(savedEvent._id);
            callback();
        });
    }



    if (elem.events) {
        async.each(events, function(postedEvent, callback) {

            if (undefined === postedEvent._id || null === postedEvent._id) {
                return setProperties(new EventModel(), postedEvent, callback);
            }

            EventModel.findById(postedEvent._id, function(err, existingEvent) {
                if (existingEvent) {
                    setProperties(existingEvent, postedEvent, callback);
                } else {
                    setProperties(new EventModel(), postedEvent, callback);
                }
            });

        }, function(err) {
            if (err) {
                return deferred.reject(err);
            }

            deferred.resolve(elem);
        });


        return deferred.promise;
    }


    // create new document

    var newEventDocument = new EventModel();
    setProperties(newEventDocument);

    return deferred.promise;
}


/**
 * get one period for one element
 * combine mutiples events into one if more than one event
 * @return {object}
 */
function getElemPeriod(elem)
{
    if (elem.events.length === 0) {
        throw new Error('Missing events in element');
    }

    if (elem.events.length === 1) {
        return elem.events[0];
    }

    var period = {
        dtstart: elem.events[0].dtstart,
        dtend: elem.events[0].dtend
    };

    elem.events.forEach(function(evt) {
        if (evt.dtstart < period.dtstart) {
            period.dtstart = evt.dtstart;
        }

        if (evt.dtend > period.dtend) {
            period.dtend = evt.dtend;
        }
    });

    return period;
}



/**
 * This function will create or update an absence element
 *
 * @param {apiService}                  service
 * @param {User} user                   The user document
 * @param {object} elem                 elem object from params
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

    var elemPeriod = getElemPeriod(elem);

    function setProperties(element)
    {
        element.quantity = elem.quantity;
        element.consumedQuantity = elem.consumedQuantity;

        RightModel.findOne({ _id: elem.right.id })
        .populate('type')
        .exec(function(err, rightDocument) {

            if (err) {
                return deferred.reject(err);
            }

            //TODO: the renewal ID tu use must be in params
            // a right can have multiples usable renewals at the same time

            // get renewal to save in element
            rightDocument.getPeriodRenewal(elemPeriod.dtstart, elemPeriod.dtend).then(function(renewal) {

                if (null === renewal) {
                    return deferred.reject('No available renewal for the element');
                }


                element.right = {
                    id: elem.right.id,
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



                saveEvents(service, user, element, elem.events).then(function() {


                    element.save(function(err, element) {
                        if (err) {
                            return deferred.reject(err);
                        }
                        deferred.resolve(element);
                    });
                }, deferred.reject);


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
 * @param {apiService}                  service
 * @param {User} user                   The user document
 * @param {object} elem                 elem object from params
 * @return {Promise}
 */
function checkElement(service, user, elem)
{
    var util = require('util');
    var Q = require('q');
    var deferred = Q.defer();
    var RightModel = service.app.db.models.Right;
    var AccountModel = service.app.db.models.Account;


    if (undefined === elem.right) {
        return deferred.reject('element must contain a right property');
    }

    if (undefined === elem.right.id) {
        return deferred.reject('element must contain a right.id property');
    }

    if (undefined === elem.right.renewal) {
        return deferred.reject('element must contain a right.renewal property');
    }

    if (undefined === elem.events) {
        return deferred.reject('element must contain an events property');
    }

    if (undefined === elem.quantity) {
        return deferred.reject('element must contain a quantity property');
    }


    var elemPeriod = getElemPeriod(elem);

    RightModel.findOne({ _id: elem.right.id })
        .exec(function(err, rightDocument) {

        if (!rightDocument) {
            return deferred.reject('failed to get right document from id '+elem.right.id);
        }

        // get renewal to save in element
        rightDocument.getPeriodRenewal(elemPeriod.dtstart, elemPeriod.dtend).then(function(renewal) {

            if (null === renewal) {
                return deferred.reject('No available renewal for the element');
            }



            AccountModel.findOne({ 'user.id': user  })
            .exec(function(err, accountDocument) {
                renewal.right = rightDocument;
                var accountRight = accountDocument.getAccountRight(renewal);

                accountRight.getAvailableQuantity().then(function(available) {

                    if (available < elem.quantity) {
                        return deferred.reject(util.format('The quantity requested on right "%s" is not available', rightDocument.name));
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
    var deferred = Q.defer();

    if (params.distribution === undefined || params.distribution.length === 0) {
        return Q.fcall(function () {
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

    Q.all(chekedElementsPromises).then(function() {

        // save the events and create the elements documents

        for(i=0; i<params.distribution.length; i++) {
            elem = params.distribution[i];
            elem.consumedQuantity = collection.getConsumedQuantity(elem.quantity);
            savedElementsPromises.push(saveElement(service, user, elem));
        }

        deferred.resolve(Q.all(savedElementsPromises));

    }, deferred.reject);

    return deferred.promise;
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
        return Q.reject('Invalid request, no distribution');
    }

    if (undefined === distribution[0].events) {
        return Q.reject('Invalid request, events are not available in first right of distribution');
    }

    if (undefined === distribution[distribution.length -1].events) {
        return Q.reject('Invalid request, events are not available in last right of distribution');
    }

    dtstart = distribution[0].events[0].dtstart;
    var lastElemEvents = distribution[distribution.length -1].events;
    dtend = lastElemEvents[lastElemEvents.length -1].dtend;

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
    var getApprovalSteps = require('../../../../modules/getApprovalSteps');








    getApprovalSteps(user).then(function(approvalSteps) {

        var account = user.roles.account;


        var fieldsToSet = {
            user: {
                id: params.user,
                name: account.user.name,
                department: user.department.name
            },
            approvalSteps: approvalSteps
        };


        // Set the request status

        if (0 === approvalSteps.length) {
            fieldsToSet.status = {
                created: 'approved'
            };
        } else {

            fieldsToSet.status = {
                created: 'waiting'
            };
        }



        if (undefined !== params.absence) {

            getCollectionFromDistribution(params.absence.distribution, account).then(function(collection) {

                var promisedDistribution = saveAbsence(service, user, params.absence, collection);

                promisedDistribution.then(function(distribution) {

                        fieldsToSet.events = [];

                        // push elements events to the request events

                        var d, e, elem;

                        for(d=0; d<distribution.length; d++) {
                            elem = distribution[d];
                            for(e=0; e<elem.events.length; e++) {
                                fieldsToSet.events.push(elem.events[e]);
                            }
                        }

                        fieldsToSet.absence = {
                            distribution: distribution
                        };

                        if (null !== collection) {
                            fieldsToSet.absence.rightCollection = collection._id;
                        }

                        deferred.resolve(fieldsToSet);

                }, deferred.reject);

            }, deferred.reject);
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
        var elem, events;

        if (requestDoc.absence === undefined) {
            return;
        }

        AbsenceElemModel.find().where('_id').in(requestDoc.absence.distribution)
            .populate('events')
            .exec(function(err, elements) {

            if (err) {
                return console.log(err);
            }

            var i, j, event;

            for (i=0; i<elements.length; i++) {

                elem = elements[i];
                events = elem.events;

                for (j=0; j<events.length; j++) {

                    event = events[j];

                    if (event.absenceElem !== elem._id) {
                        event.request = requestDoc._id;
                        event.absenceElem = elem._id;

                        if ('waiting' === requestDoc.status.created) {
                            event.status = 'TENTATIVE';
                        }

                        event.save();
                    }
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
                _id: params.id
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

        }, service.error);

    });
}
    
    

    
    
    
    



/**
 * Construct the requests save service
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


