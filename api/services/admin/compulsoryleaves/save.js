'use strict';

const saveAbsence = require('./../../user/requests/saveAbsence');
const Services = require('restitute').service;
const util = require('util');
const requestcreated = require('../../../../modules/emails/requestcreated');

/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

    const gt = service.app.utility.gettext;

    if (service.needRequiredFields(params, ['dtstart', 'dtend', 'name', 'userCreated', 'collections', 'departments', 'right'])) {
        return;
    }

    if (params.dtend <= params.dtstart) {
        return service.error(gt.gettext('Finish date must be greater than start date'));
    }

    if (params.collections.constructor !== Array) {
        return service.error(gt.gettext('collections must be an array'));
    }

    if (params.departments.constructor !== Array) {
        return service.error(gt.gettext('departments must be an array'));
    }

    if (params.departments.length === 0 && params.collections.length === 0) {
        return service.error(gt.gettext('either departments or collections must contain items'));
    }

    if (params.userCreated === undefined) {
        throw new Error('The createdBy parameter is missing');
    }


    saveCompulsoryLeave(service, params);
}



function getIds(list) {
    return list.map(item => {
        if (typeof item === 'string') {
            return item;
        }

        if (item._id !== undefined) {
            return item._id;
        }

        throw new Error('wrong data type');
    });
}







/**
 * save all new requests
 * @param {apiService} service
 * @param {Object} params
 * @return {Promise} Resolve to an array of compulsory leave requests
 */
function saveRequests(service, params) {

    const gt = service.app.utility.gettext;
    const postpone = service.app.utility.postpone;

    /**
     * Get user document with validation
     * @throws {Error} [[Description]]
     * @param   {String} userId [[Description]]
     * @returns {Promise} [[Description]]
     */
    function getUser(userId) {
        let User = service.app.db.models.User;

        return User.findOne({ _id:userId })
        .populate('roles.account')
        .populate('department')
        .exec()
        .then(user => {
            if (!user) {
                throw new Error('User not found');
            }

            if (!user.roles.account) {
                throw new Error('User have no absences account');
            }

            return user;
        });
    }


    /**
     * Get right document with validation
     * @throws {Error} [[Description]]
     * @returns {Promise} [[Description]]
     */
    function getRight() {
        let Right = service.app.db.models.Right;

        return Right.findOne({ _id:params.right })
        .populate('type')
        .exec()
        .then(right => {
            if (!right) {
                throw new Error('Right not found');
            }

            return right;
        });
    }


    function getQuantity(events) {
        return getRight().then(right => {

            let duration = 0;

            events.forEach(event => {
                let ms = event.dtend.getTime() - event.dtstart.getTime();

                if ('D' === right.quantity_unit) {
                    duration += event.businessDays;
                }

                if ('H' === right.quantity_unit) {
                    duration += ms /1000 /3600;
                }
            });

            return duration;
        });
    }



    /**
     * Get list of available events between two date
     * @return {Promise}
     */
    function getEvents(user) {
        let calendarevents = Services.load(service.app, 'user/calendarevents/list');

        return calendarevents.getResultPromise({
            user: user._id,
            dtstart: params.dtstart,
            dtend: params.dtend,
            type: 'workschedule',
            subtractNonWorkingDays: true,
            subtractPersonalEvents: true
        });
    }


    /**
     * Create element event from schedule calendar event
     * @param   {CalendarEvent} event Schedule calendar event
     * @param   {User}          user  event owner
     * @returns {object}        Raw object for document creation
     */
    function createElementEventFromSheduleEvent(event, user) {
        return {
            dtstart: event.dtstart,
            dtend: event.dtend,
            summary: params.name,
            description: params.description,
            status: 'CONFIRMED',
            user: {
                id: user._id,
                name: user.getName()
            }
        };
    }

    /**
     * Create element events from schedule calendar event
     * @param   {Array} events Schedule calendar events
     * @param   {User} user   user  event owner
     * @returns {Array} list of objects for event creation
     */
    function createElementEvents(events, user) {
        return events.map(event => {
            return createElementEventFromSheduleEvent(event, user);
        });
    }



    /**
     * Create one user request
     * @param {String} userId
     * @return {Promise} resolve to a Request document
     */
    function createRequest(userId) {

        let fieldsToSet;

        let Request = service.app.db.models.Request;

        return getUser(userId)
        .then(user => {



            fieldsToSet = {
                user: {
                    id: user._id,
                    name: user.getName()
                },
                createdBy: {
                    id: params.userCreated._id,
                    name: params.userCreated.getName()
                },
                approvalSteps: [],
                absence: {},
                status: {
                    created: 'accepted'
                },
                requestLog: [{
                    action: 'create',
                    userCreated: {
                        id: params.userCreated._id,
                        name: params.userCreated.getName()
                    }
                }]
            };

            if (user.department) {
                fieldsToSet.user.department = user.department.name;
            }

            return getEvents(user)
            .then(events => {

                if (0 === events.length) {
                    throw new Error(
                        util.format(
                            gt.gettext('No availability on period for %s'),
                            user.getName()
                        )
                    );
                }



                return getQuantity(events)
                .then(quantity => {


                    let element = {
                        quantity: quantity,
                        events: createElementEvents(events, user),
                        user: fieldsToSet.user,
                        right: {
                            id: params.right
                        }
                    };

                    fieldsToSet.absence.distribution = [element];

                    return saveAbsence.getCollectionFromDistribution(fieldsToSet.absence.distribution, user.roles.account);

                });

            })
            .then(function(rightCollection) {

                if (null !== rightCollection) {
                    fieldsToSet.absence.rightCollection = rightCollection._id;
                }
                return saveAbsence.saveAbsenceDistribution(service, user, fieldsToSet, rightCollection);
            })
            .then(distribution => {

                fieldsToSet.events = saveAbsence.getEventsFromDistribution(distribution);
                fieldsToSet.absence.distribution = distribution;

                let req = new Request();
                req.set(fieldsToSet);

                return req.save()
                .then(requestDoc => {
                    return saveAbsence.saveEmbedEvents(requestDoc)
                    .then(() => {
                        requestcreated(service.app, requestDoc);
                        return requestDoc;
                    });
                });
            });
        });
    }


    /**
     * Set request property of a compulsory leave request
     * @param {Object} compulsoryLeaveRequest
     * @param {Request} request null value accepted
     * @return {Promise} promised compulsory leave request
     */
    function setRequestInClr(compulsoryLeaveRequest, request) {

        if (null === request) {
            return Promise.resolve(null);
        }

        compulsoryLeaveRequest.request = request._id;
        compulsoryLeaveRequest.quantity = request.getQuantity();
        return Promise.resolve(compulsoryLeaveRequest);
    }

    /**
     * Add user name to the compusory leave request
     * @param {CompulsoryLeaveRequest}
     * @return {Promise}
     */
    function addUserName(compulsoryLeaveRequest) {

        if (null === compulsoryLeaveRequest) {
            return Promise.resolve(compulsoryLeaveRequest);
        }

        let User = service.app.db.models.User;
        return User.findById(compulsoryLeaveRequest.user.id).exec()
        .then(user => {
            compulsoryLeaveRequest.user.name = user.getName();
            return compulsoryLeaveRequest;
        });
    }

    /**
     * Capture error on request promise
     * @param {[[Type]]} requestPromise [[Description]]
     */
    function captureError(requestPromise) {

        return new Promise(resolve => {
            requestPromise
            .then(resolve)
            .catch(error => {
                service.addAlert('info', error.message);
                resolve(null);
            });
        });
    }


    /**
     * Refresh users cache
     * @param {Array} dates list of deleted items start date
     * @param {Array} users list of deleted items appliquants
     */
    function refreshUserCache(dates, users) {

        let promises = [];
        for (let i=0; i<dates.length; i++) {
            let user = users[i];
            let dtstart = dates[i];

            promises.push(user.updateRenewalsStat(dtstart));
        }
        return postpone(() => Promise.all(promises));
    }




    /**
     * Delete the requests not present in new version of compulsory leave
     * @param {Array} validList List of request ID
     * @return {Promise} list of deleted documents
     */
    function deleteInvalidRequests(validList) {

        if (!params.id) {
            // creation
            return Promise.resolve([]);
        }

        const Request = service.app.db.models.Request;
        const User = service.app.db.models.User;

        return Request
        .find({
            'absence.compulsoryLeave': params.id,
            _id: { $nin: validList }
        })
        .populate('events')
        .exec()
        .then(documents => {

            let dates = documents.map(doc => doc.events[0].dtstart);

            // get list of users where to update cache

            let users = documents.map(doc => doc.user.id);
            return User.find()
            .where('_id').in(users)
            .exec()
            .then(users => {
                return Promise.all(
                    documents.map(doc => {
                        return doc.remove();
                    })
                )
                .then(() => {
                    return refreshUserCache(dates, users);
                });
            });
        });
    }


    /**
     * Update stat cache for a list of requests
     * @var {Array} compulsoryLeaveRequests
     */
    function updateUsersStatCache(compulsoryLeaveRequests, requestIds) {
        if (service.app.config.useSchudeledRefreshStat) {
            const userIds = compulsoryLeaveRequests.map(doc => doc.user.id);
            return service.app.db.models.Account.updateMany(
                { 'user.id': { $in: userIds } },
                { $set: { renewalStatsOutofDate: true } }
            ).exec();
        }

        return service.app.db.models.Request.find()
        .where('_id').in(requestIds)
        .populate('user.id')
        .exec()
        .then(requests => {
            const promises = requests.map(requestDoc => requestDoc.user.id.updateRenewalsStat(requestDoc.events[0].dtstart));
            return postpone(() => Promise.all(promises));
        });
    }


    let promises = [];

    if (undefined !== params.requests) {
        params.requests.forEach(compulsoryLeaveRequest => {

            if (!compulsoryLeaveRequest) {
                // error ?
                return;
            }

            if (compulsoryLeaveRequest.request) {
                // already created
                promises.push(Promise.resolve(compulsoryLeaveRequest));
                return;
            }


            promises.push(
                captureError(createRequest(compulsoryLeaveRequest.user.id))
                .then(setRequestInClr.bind(null, compulsoryLeaveRequest))
                .then(addUserName)
            );
        });
    }



    return Promise.all(promises)
    .then(clrs => {

        const validRequestIds = [];
        const validCompulsoryLeaveRequests = [];

        clrs.forEach(clr => {
            if (null !== clr) {
                validCompulsoryLeaveRequests.push(clr);
                validRequestIds.push(clr.request);
            }
        });

        // remove unprocessed requests
        // This refresh stat cache for owners deleted requests

        return updateUsersStatCache(validCompulsoryLeaveRequests, validRequestIds)
        .then(() => {
            return deleteInvalidRequests(validRequestIds);
        })
        .then(() => {
            return validCompulsoryLeaveRequests;
        });

    });

}








/**
 * Update/create the compulsory leave document
 *
 * @param {apiService} service
 * @param {Object} params
 */
function saveCompulsoryLeave(service, params) {

    const gt = service.app.utility.gettext;

    /**
     * Save compulsory leave reference into absence requests
     * @param {object} compulsoryLeave A saved compulsory leave document
     * @return {Promise}
     */
    function updateCompulsoryLeaveRef(compulsoryLeave) {

        /**
         * Absences requests ID list
         */
        let requestIds = [];

        let Request = service.app.db.models.Request;


        for (let i=0; i<compulsoryLeave.requests.length; i++) {
            requestIds.push(compulsoryLeave.requests[i].request);
        }



        return Request.find({ _id: { $in: requestIds } }).exec()
        .then(requests => {
            let promises = [];
            for (let j=0; j<requests.length; j++) {
                requests[j].absence.compulsoryLeave = compulsoryLeave._id;
                promises.push(requests[j].save());
            }

            return Promise.all(promises);
        })
        .then(() => {
            return compulsoryLeave;
        });
    }



    let CompulsoryLeaveModel = service.app.db.models.CompulsoryLeave;

    let rightId;

    if (params.right._id === undefined) {
        rightId = params.right;
    } else {
        rightId = params.right._id;
    }

    var fieldsToSet = {
        userUpdated: {
            id: params.userCreated._id,
            name: params.userCreated.getName()
        },
        lastUpdate: new Date(),
        name: params.name,
        description: params.description,
        dtstart: params.dtstart,
        dtend: params.dtend,
        collections: getIds(params.collections),
        departments: getIds(params.departments),
        right: rightId
    };


    saveRequests(service, params)
    .then(compulsoryLeaveRequests => {

        fieldsToSet.requests = compulsoryLeaveRequests;


        if (params.id)
        {
            // update
            CompulsoryLeaveModel.findOne({ _id: params.id }).exec()
            .then(document => {
                document.set(fieldsToSet);
                return document.save();
            })
            .then(updateCompulsoryLeaveRef)
            .then(document => {
                service.resolveSuccessGet(
                    document._id,
                    gt.gettext('The compulsory leave period has been modified')
                );
            }).catch(service.error);


        } else {

            fieldsToSet.userCreated = {
                id: params.userCreated._id,
                name: params.userCreated.getName()
            };

            var document = new CompulsoryLeaveModel();
            document.set(fieldsToSet);
            document.save()
            .then(updateCompulsoryLeaveRef)
            .then(document => {
                service.resolveSuccessGet(
                    document._id,
                    gt.gettext('The compulsory leave period has been created')
                );
            }).catch(service.error);
        }

    })
    .catch(service.error);
}






/**
 * Construct the compulsory leave save service
 * @param   {object}          services list of base classes from apiService
 * @param   {express|object}  app      express or headless app
 * @returns {saveItemService}
 */
exports = module.exports = function(services, app) {

    var service = new services.save(app);

    /**
     * Call the compulsory leave save service
     *
     * @param {Object} params
     *                     params.dtstart
     *                     params.dtend
     *                     params.name
     *                     params.userCreated (provided by rest service)
     *                     params.collections
     *                     params.departments
     *                     params.right
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        validate(service, params);
        return service.deferred.promise;
    };


    return service;
};
