'use strict';

const util = require('util');


/**
 * Get a function used to set properties on a element object
 * @return {Function}
 */
function getElementIgniter(service, collection, user)
{
    let RightModel = service.app.db.models.Right;
    let rightDocument, renewalDocument;



    /**
     * Set properties of an element object
     * @param   {AbsenceElem}   element Mongoose document
     * @param   {Object}        elem    Posted informations
     * @returns {Promise}  Resolve to the element object
     */
    return function setElemProperties(element, elem) {

        let elemPeriod = getElemPeriod(elem);

        element.quantity = elem.quantity;

        return RightModel.findOne({ _id: elem.right.id })
        .populate('type')
        .exec()
        .then(right => {
            rightDocument = right;
            // get renewal to save in element
            if (elem.right.renewal) {
                // a specific renewal is given as parameter
                return rightDocument.getRenewal(elem.right.renewal);
            } else {
                // use the renewal from period (default)
                return rightDocument.getPeriodRenewal(elemPeriod.dtstart, elemPeriod.dtend);
            }
        })
        .then(renewal => {

            if (null === renewal) {
                throw new Error('No available renewal for the element');
            }

            renewalDocument = renewal;

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


            return createEvents(service, user, element, elem.events);


        }).then(events => {
            element.events = events;
            return rightDocument.getConsumedQuantity(collection, element);

        }).then(consumed => {
            element.consumedQuantity = consumed;

            return {
                element: element,
                user: user,
                right: rightDocument,
                renewal: renewalDocument
            };
        });
    };

}



/**
 * This function will create or update events objects without saving to db
 *
 * @param {apiService}  service
 * @param {User}        user         The user document
 * @param {AbsenceElem} elem
 * @param {array}       events       array of objects
 *
 * @return {Promise}        resolve to an array
 */
function createEvents(service, user, elem, events)
{
    let EventModel = service.app.db.models.CalendarEvent;

    /**
     * Set event properties
     *
     * @param {CalendarEvent} eventDocument     new event document to save or event document to update on request modification
     * @param {object} event                    Object with user given informations for event
     *                                          summary and description are set here for compulsory leaves but not for regular leaves
     * @param {function} callback
     */
    function setEventProperties(eventDocument, event)
    {
        eventDocument.summary = event.summary;

        if (undefined === event.summary) {
            if (undefined === elem.right.type) {
                eventDocument.summary = elem.right.name;
            } else {
                eventDocument.summary = elem.right.type.name;
            }
        }

        eventDocument.description = event.description;

        eventDocument.dtstart = event.dtstart;
        eventDocument.dtend = event.dtend;
        eventDocument.user = {
            id: user._id,
            name: user.getName()
        };

        return eventDocument;
    }


    let allEvents = [];
    let oldEventPromises = [];
    let oldPostedEvents = [];


    for (let i=0; i<events.length; i++) {
        let postedEvent = events[i];

        if (undefined === postedEvent._id || null === postedEvent._id) {
            // new event
            allEvents.push(setEventProperties(new EventModel(), postedEvent));
            continue;
        }

        oldEventPromises.push(EventModel.findById(postedEvent._id).exec());
        oldPostedEvents.push(postedEvent);
    }


    if (0 === oldEventPromises.length) {

        if (allEvents.length === 0) {
            throw new Error('No events created from parameters');
        }

        return Promise.resolve(allEvents);
    }


    // update properties of old events

    return Promise.all(oldEventPromises)
    .then(oldEvents => {
        for (let i=0; i<oldEvents.length; i++) {
            let existingEvent = oldEvents[i];
            let postedEvent = oldPostedEvents[i];

            if (existingEvent) {
                allEvents.push(setEventProperties(existingEvent, postedEvent));
            } else {
                allEvents.push(setEventProperties(new EventModel(), postedEvent));
            }
        }


        if (allEvents.length === 0) {
            throw new Error('No events created from parameters');
        }

        return allEvents;
    });

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
 * Create element object from posted informations
 * @param {apiService} service
 * @param {User} user                   The user document
 * @param {object} elem                 elem object from params
 * @param {RightCollection} collection
 * @param {Function} setElemProperties
 * @return {Promise}
 */
function createElement(service, user, elem, collection, setElemProperties)
{

    if (undefined === elem.right) {
        throw new Error('element must contain a right property');
    }

    if (undefined === elem.right.id) {
        throw new Error('element must contain a right.id property');
    }

    if (undefined === elem.events) {
        throw new Error('element must contain an events property');
    }

    if (0 === elem.events.length) {
        throw new Error('element.events must contain one event');
    }

    if (undefined === elem.quantity) {
        throw new Error('element must contain a quantity property');
    }


    if (!collection) {
        throw new Error('The collection is missing');
    }

    let ElementModel = service.app.db.models.AbsenceElem;





    if (elem._id) {
        // updated existing element
        return ElementModel.findById(elem._id)
        .then(existingElement => {

            if (existingElement) {
                return setElemProperties(existingElement);
            }

            // Not found
            return setElemProperties(new ElementModel());
        });
    }

    // create new element
    return setElemProperties(new ElementModel());
}



/**
 * Check element validity of one element
 * @param {object} contain element is stored in contain.element
 * @return {Promise}   Resolve to contain
 */
function checkElement(contain)
{
    let rightDocument = contain.right;
    let renewalDocument = contain.renewal;
    let userDocument = contain.user;
    let element = contain.element;

    let dtstart = element.events[0].dtstart;
    let dtend = element.events[element.events.length-1].dtend;


    if (!rightDocument.validateRules(renewalDocument, userDocument._id, dtstart, dtend)) {
        return Promise.reject('This renewal is not valid on the period: '+rightDocument.name+' ('+renewalDocument.start+' - '+renewalDocument.finish+')');
    }

    if (userDocument.roles.account.arrival > renewalDocument.finish) {
        return Promise.reject('Arrival date must be before renewal finish');
    }


    return renewalDocument.getUserAvailableQuantity(userDocument, rightDocument, dtstart, dtend)
    .then(availableQuantity => {
        if (availableQuantity < element.consumedQuantity) {
            throw new Error(util.format('The quantity requested on right "%s" is not available, available quantity is %s', rightDocument.name, availableQuantity));
        }

        return contain;
    });
}


/**
 * delete invalid elements
 *
 * @return {Promise} the list of deleted elements
 */
function deleteElements(service, params) {


    if (!params.id) {
        return Promise.resolve([]);
    }

    let Request = service.app.db.models.Request;

    return Request.findOne({ _id: params.id }).exec()
    .then(request => {
        if (!request) {
            return [];
        }

        return request.deleteElements();
    });
}





/**
 * Save list of absence elment
 *
 * @param {apiService} service
 * @param {User} user             absence owner object
 * @param {Object} params
 * @param {RightCollection} collection
 *
 * @return {Promise} promised distribution array
 */
function saveAbsenceDistribution(service, user, params, collection) {


    if (params.absence.distribution === undefined || params.absence.distribution.length === 0) {
        return Promise.reject('right distribution is mandatory to save an absence request');
    }

    let i, elem,
        containsPromises = [];

    let setElemProperties = getElementIgniter(service, collection, user);

    // promisify all elements in the contain objects

    for(i=0; i<params.absence.distribution.length; i++) {
        elem = params.absence.distribution[i];
        containsPromises.push(createElement(service, user, elem, collection, setElemProperties));
    }

    return deleteElements(service, params)
    .then(() => {
        return Promise.all(containsPromises);
    })
    .then(contains => {

        // promisify all checks

        let checkPromises = [];
        contains.forEach(contain => {
            checkPromises.push(checkElement(contain));
        });

        return Promise.all(checkPromises);


    })
    .then(contains => {

        // promisify all save on element
        let savedElementsPromises = [];

        contains.forEach(contain => {

            savedElementsPromises.push(
                contain.element.saveEvents().then(() => {
                    return contain.element.save();
                })
            );
        });

        return Promise.all(savedElementsPromises);
    });
}


/**
 * Get the appliquable right collection of the user on the distribution period
 * Multiple collection in the same request period is not allowed
 *
 * @param {Array} distribution posted parameter
 * @param {Account} account
 * @return {Promise} promise the rightCollection or null if the user has no right collection on the period
 *
 */
function getCollectionFromDistribution(distribution, account) {

    if (undefined === distribution[0]) {
        throw new Error('Invalid request, no distribution');
    }

    if (undefined === distribution[0].events) {
        throw new Error('Invalid request, events are not available in first right of distribution');
    }

    if (0 === distribution[0].events.length) {
        throw new Error('Invalid request, nothing in right distribution');
    }

    if (undefined === distribution[distribution.length -1].events) {
        throw new Error('Invalid request, events are not available in last right of distribution');
    }

    const dtstart = distribution[0].events[0].dtstart;
    const lastElemEvents = distribution[distribution.length -1].events;
    const dtend = lastElemEvents[lastElemEvents.length -1].dtend;

    return account.getValidCollectionForPeriod(dtstart, dtend, new Date());

}






/**
 * Update link to absences elements in the linked events
 * @param {Request} requestDoc
 * @return {Promise}
 */
function saveEmbedEvents(requestDoc)
{
    let elem, events;
    let AbsenceElemModel = requestDoc.model('AbsenceElem');


    return AbsenceElemModel.find()
    .where('_id').in(requestDoc.absence.distribution)
    .populate('events')
    .exec()
    .then(elements => {

        let i, j, event;
        let eventSavePromises = [];

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

                    eventSavePromises.push(event.save());
                }
            }
        }

        return Promise.all(eventSavePromises);

    });

}



function getEventsFromDistribution(distribution) {
    let events = [];

    // push elements events to the request events

    let d, e, elem;

    for(d=0; d<distribution.length; d++) {
        elem = distribution[d];
        for(e=0; e<elem.events.length; e++) {
            events.push(elem.events[e]);
        }
    }

    if (events.length === 0) {
        throw new Error('No events found in distribution');

    }

    return events;
}




exports = module.exports = {
    saveAbsenceDistribution: saveAbsenceDistribution,
    getCollectionFromDistribution: getCollectionFromDistribution,
    saveEmbedEvents: saveEmbedEvents,
    getEventsFromDistribution: getEventsFromDistribution,
    getElementIgniter: getElementIgniter
};
