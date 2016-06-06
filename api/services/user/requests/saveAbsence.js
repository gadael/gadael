'use strict';



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
    let async = require('async');
    let EventModel = service.app.db.models.CalendarEvent;

    let deferred = {};
    deferred.promise = new Promise(function(resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });



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

            if (undefined === postedEvent._id || null === postedEvent._id) {
                return setProperties(new EventModel(), postedEvent, callback);
            }

            EventModel.findById(postedEvent._id, function(err, existingEvent) {

                if (err) {
                    return deferred.reject(err);
                }

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
 * @param {RightCollection} collection
 *
 * @return {Promise}        Promise the AbsenceElem document
 */
function saveElement(service, user, elem, collection)
{
    return new Promise(function(resolve, reject) {

        if (!collection) {
            return reject('The collection is missing');
        }

        let ElementModel = service.app.db.models.AbsenceElem;
        let RightModel = service.app.db.models.Right;

        let elemPeriod = getElemPeriod(elem);

        function setProperties(element)
        {
            element.quantity = elem.quantity;

            RightModel.findOne({ _id: elem.right.id })
            .populate('type')
            .exec(function(err, rightDocument) {

                if (err) {
                    return reject(err);
                }


                //TODO: the renewal ID tu use must be in params
                // a right can have multiples usable renewals at the same time

                // get renewal to save in element
                rightDocument.getPeriodRenewal(elemPeriod.dtstart, elemPeriod.dtend).then(function(renewal) {

                    if (null === renewal) {
                        return reject('No available renewal for the element');
                    }


                    element.right = {
                        id: elem.right.id,
                        name: rightDocument.name,
                        quantity_unit: rightDocument.quantity_unit,
                        renewal: {
                            id: renewal._id,
                            start: renewal.start,
                            finish: renewal.finish
                        },
                        consuption: rightDocument.consuption,
                        consuptionBusinessDaysLimit: rightDocument.consuptionBusinessDaysLimit
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


                        // The consumed quantity
                        // will be computed from collection and elem parameters
                        rightDocument.getConsumedQuantity(collection, element).then(consumed => {
                            element.consumedQuantity = consumed;

                            element.save(function(err, element) {
                                if (err) {
                                    return reject(err);
                                }
                                resolve(element);
                            });

                        }).catch(reject);

                    }).catch(reject);

                }).catch(reject);


            });
        }


        if (elem._id) {
            // updated existing element
            ElementModel.findById(elem._id, function(err, existingElement) {

                if (err) {
                    return reject(err);
                }

                if (elem) {
                    setProperties(existingElement);
                } else {
                    setProperties(new ElementModel());
                }
            });
            return;
        }

        // create new element
        setProperties(new ElementModel());
    });
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
    const util = require('util');
    const RightModel = service.app.db.models.Right;
    const RenewalModel = service.app.db.models.RightRenewal;

    let deferred = {};
    deferred.promise = new Promise(function(resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });




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

        if (err) {
            return deferred.reject(err);
        }

        if (!rightDocument) {
            return deferred.reject('failed to get right document from id '+elem.right.id);
        }


        RenewalModel.findOne({ _id: elem.right.renewal })
        .exec(function(err, renewalDocument) {

            if (err) {
                return deferred.reject(err);
            }

            if (null === renewalDocument) {
                return deferred.reject('No available renewal for the element');
            }


            if (!rightDocument.validateRules(renewalDocument, user._id, elemPeriod.dtstart, elemPeriod.dtend)) {
                return deferred.reject('This renewal is not valid on the period: '+rightDocument.name+' ('+renewalDocument.start+' - '+renewalDocument.finish+')');
            }



            // get renewal to save in element
            rightDocument.getPeriodRenewal(elemPeriod.dtstart, elemPeriod.dtend).then(function(renewal) {


                if (user.roles.account.arrival > renewalDocument.finish) {
                    return deferred.reject('Arrival date must be before renewal finish');
                }


                renewal.getUserAvailableQuantity(user).then(function(available) {

                    if (available < elem.quantity) {
                        return deferred.reject(util.format('The quantity requested on right "%s" is not available', rightDocument.name));
                    }

                    deferred.resolve(true);


                }, deferred.reject);
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
 *
 * @return {Promise} promised distribution array
 */
function saveAbsence(service, user, params, collection) {

    return new Promise((resolve, reject) => {

        if (params.distribution === undefined || params.distribution.length === 0) {
            throw new Error('right distribution is mandatory to save an absence request');
        }

        let i, elem,
            chekedElementsPromises = [],
            savedElementsPromises = [];

        // check available quantity

        for(i=0; i<params.distribution.length; i++) {
            elem = params.distribution[i];
            chekedElementsPromises.push(checkElement(service, user, elem));
        }

        Promise.all(chekedElementsPromises).then(function() {

            // save the events and create the elements documents

            for(i=0; i<params.distribution.length; i++) {
                elem = params.distribution[i];
                savedElementsPromises.push(saveElement(service, user, elem, collection));
            }

            resolve(Promise.all(savedElementsPromises));

        }, reject);

    });
}


/**
 * Get the appliquable right collection of the user on the distribution period
 * Multiple collection in the same request period is not allowed
 *
 * @param {Array} distribution posted parameter
 * @return {Promise} promise the rightCollection or null if the user has no right collection on the period
 *
 */
function getCollectionFromDistribution(distribution, account) {


    return new Promise((resolve, reject) => {

        if (undefined === distribution[0]) {
            return reject('Invalid request, no distribution');
        }

        if (undefined === distribution[0].events) {
            return reject('Invalid request, events are not available in first right of distribution');
        }

        if (undefined === distribution[distribution.length -1].events) {
            return reject('Invalid request, events are not available in last right of distribution');
        }

        const dtstart = distribution[0].events[0].dtstart;
        const lastElemEvents = distribution[distribution.length -1].events;
        const dtend = lastElemEvents[lastElemEvents.length -1].dtend;

        resolve(
            account.getValidCollectionForPeriod(dtstart, dtend, new Date())
        );

    });


}






/**
 * Update link to absences elements in the linked events
 * @param {Request} requestDoc
 */
function saveEmbedEvents(service, requestDoc)
{
    var elem, events;
    var AbsenceElemModel = service.app.db.models.AbsenceElem;


    AbsenceElemModel.find().where('_id').in(requestDoc.absence.distribution)
        .populate('events')
        .exec(function(err, elements) {

        if (err) {
            return console.trace(err);
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







exports = module.exports = {
    saveAbsence: saveAbsence,
    getCollectionFromDistribution: getCollectionFromDistribution,
    saveEmbedEvents: saveEmbedEvents
};
