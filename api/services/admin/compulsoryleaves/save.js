'use strict';


const gt = require('./../../../../modules/gettext');
const saveAbsence = require('./../../user/requests/saveAbsence');
var Services = require('restitute').service;

/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

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
 * @return {Promise}
 */
function saveRequests(service, params) {


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
     * Get list of events between two date
     * @return {Promise}
     */
    function getEvents(user) {
        let calendarevents = Services.load(service.app, 'user/calendarevents/list');

        return calendarevents.getResultPromise({
            user: user._id,
            dtstart: params.dtstart,
            dtend: params.dtend,
            type: 'workschedule',
            substractNonWorkingDays: true,
            substractPersonalEvents: true
        });
    }



    /**
     * Create one user request
     * @param {String} userId
     * @return {Promise}
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
                }
            };

            if (user.department) {
                fieldsToSet.user.department = user.department.name;
            }

            return getEvents(user)
            .then(events => {

                let elementEvents = [];
                events.forEach(event => {
                    elementEvents.push({
                        dtstart: event.dtstart,
                        dtend: event.dtend,
                        summary: params.name,
                        description: params.description,
                        status: 'CONFIRMED',
                        user: {
                            id: user._id,
                            name: user.getName()
                        }
                    });
                });

                return getQuantity(events)
                .then(quantity => {



                    let element = {
                        quantity: quantity,
                        events: elementEvents,
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

                return saveAbsence.saveAbsenceDistribution(service, user, fieldsToSet.absence, rightCollection);
            })
            .then(distribution => {

                fieldsToSet.events = saveAbsence.getEventsFromDistribution(distribution);
                fieldsToSet.absence.distribution = distribution;

                let req = new Request();
                req.set(fieldsToSet);

                return req.save().then(requestDoc => {
                    return saveAbsence.saveEmbedEvents(requestDoc).then(() => {
                        return requestDoc;
                    });
                });
            });
        });
    }


    /**
     * Set request property of a compulsory leave request
     * @param {Request} request [[Description]]
     * @return {Promise} promised compulsory leave request
     */
    function setRequestInClr(compulsoryLeaveRequest, request) {
        compulsoryLeaveRequest.request = request._id;
        return Promise.resolve(compulsoryLeaveRequest);
    }



    let promises = [];

    if (undefined !== params.requests) {
        params.requests.forEach(compulsoryLeaveRequest => {

            if (!compulsoryLeaveRequest || compulsoryLeaveRequest.request) {
                // error or allready created
                return;
            }

            promises.push(
                createRequest(compulsoryLeaveRequest.user.id)
                .then(setRequestInClr.bind(null, compulsoryLeaveRequest))
            );
        });
    }

    return Promise.all(promises).then(clrs => {

        clrs.forEach(clr => {
            if (!clr) {
                throw new Error('One of the request is missing');
            }
        });

        return clrs;
    });

}








/**
 * Update/create the compulsory leave document
 *
 * @param {apiService} service
 * @param {Object} params
 */
function saveCompulsoryLeave(service, params) {


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
        .then(all => {
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
        name: params.name,
        description: params.description,
        dtstart: params.dtstart,
        dtend: params.dtend,
        lastUpdate: new Date(),
        userCreated: {
            id: params.userCreated._id,
            name: params.userCreated.getName()
        },
        collections: getIds(params.collections),
        departments: getIds(params.departments),
        right: rightId
    };


    saveRequests(service, params).then(requests => {

        fieldsToSet.requests = requests;

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
                service.resolveSuccess(
                    document,
                    gt.gettext('The compulsory leave period has been modified')
                );
            }).catch(service.error);


        } else {

            var document = new CompulsoryLeaveModel();
            document.set(fieldsToSet);
            document.save()
            .then(updateCompulsoryLeaveRef)
            .then(document => {
                service.resolveSuccess(
                    document,
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


