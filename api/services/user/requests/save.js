'use strict';

const getApprovalSteps = require('../../../../modules/getApprovalSteps');
const saveAbsence = require('./saveAbsence');
const saveTimeSavingDeposit = require('./saveTimeSavingDeposit');
const saveWorkperiodRecover = require('./saveWorkperiodRecover');
const requestcreated = require('../../../../modules/emails/requestcreated');
const pendingapproval = require('../../../../modules/emails/pendingapproval');

/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params)
{

    const gt = service.app.utility.gettext;

    if (service.needRequiredFields(params, ['user'])) {
        return;
    }

    if (null !== service.app.config.company && service.app.config.company.maintenance) {
        return service.forbidden(gt.gettext('Request modifications are not allowed in maintenance mode'));
    }



    // modification of a request created by a compulsory leave is not allowed
    if (!params.id) {
        return saveRequest(service, params);
    }

    let Request = service.app.db.models.Request;
    Request.findOne({ _id: params.id })
        .populate('absence.compulsoryLeave')
        .exec()
    .then(request => {

        if (request && request.absence && request.absence.compulsoryLeave && request.absence.compulsoryLeave._id) {
            return service.forbidden(gt.gettext('This leave has been created in a compulsory leave, modification is not allowed'));
        }

        saveRequest(service, params);
    })
    .catch(service.error);
}



/**
 * Prepare values for an accepted request
 * @param {Object} fieldsToSet
 */
function setAccepted(fieldsToSet) {
    fieldsToSet.status = {
        created: 'accepted'
    };

    // remove all approval steps
    fieldsToSet.approvalSteps = [];

    fieldsToSet.validInterval = [{
        start: new Date(),
        finish: null
    }];
}



/**
 * @param {apiService} service
 * @param {Object} params
 * @param {User} user               Request owner
 * @return {Promise} promised fieldsToSet object
 */
function prepareRequestFields(service, params, user)
{


    return getApprovalSteps(user)
    .then(approvalSteps => {

        let account = user.roles.account;


        let fieldsToSet = {
            user: {
                id: getUserId(params),
                name: account.user.name
            },
            approvalSteps: approvalSteps
        };

        if (user.department) {
            fieldsToSet.user.department = user.department.name;
        }


        // Set the request status

        if (0 === approvalSteps.length || false === params.useApproval) {
            // useApproval is a checkbox only available to admin
            // for user, this is set to TRUE in the REST controller
            setAccepted(fieldsToSet);

        } else {

            fieldsToSet.status = {
                created: 'waiting'
            };
        }



        if (undefined !== params.absence && params.absence.distribution.length > 0) {

            fieldsToSet.absence = {};

            return saveAbsence
            .getRightsWithApproval(service, params.absence.distribution)
            .then(rights => {
                if (0 === rights.length) {
                    // No rights require approval, the default status is overwritten here
                    setAccepted(fieldsToSet);
                }

                return saveAbsence.getCollectionFromDistribution(params.absence.distribution, account);
            })
            .then(function(rightCollection) {

                if (null !== rightCollection) {
                    fieldsToSet.absence.rightCollection = rightCollection._id;
                }

                return saveAbsence.saveAbsenceDistribution(service, user, params, rightCollection);
            })
            .then(distribution => {

                fieldsToSet.events = saveAbsence.getEventsFromDistribution(distribution);
                fieldsToSet.absence.distribution = distribution;
                fieldsToSet.absence.dtstart = fieldsToSet.events[0].dtstart;
                fieldsToSet.absence.dtend = fieldsToSet.events[fieldsToSet.events.length-1].dtend;

                return fieldsToSet;

            });
        }

        if (undefined !== params.time_saving_deposit && params.time_saving_deposit.length > 0) {

            if (params.time_saving_deposit.length !== 1) {
                throw new Error('Wrong length for time_saving_deposit');
            }

            return saveTimeSavingDeposit
            .getFieldsToSet(service, params.time_saving_deposit[0])
            .then(function(tsdFields) {
                fieldsToSet.time_saving_deposit = [tsdFields];
                return fieldsToSet;
            });
        }

        if (undefined !== params.workperiod_recover && params.workperiod_recover.length > 0) {

            if (params.workperiod_recover.length !== 1) {
                throw new Error('Wrong length for workperiod_recover');
            }

            return saveWorkperiodRecover
            .getEventsPromise(service, params.events)
            .then(function(events) {
                fieldsToSet.events = events;

                return saveWorkperiodRecover
                .getFieldsToSet(service, params.workperiod_recover[0])
                .then(function(wpFields) {
                    fieldsToSet.workperiod_recover = [wpFields];
                    return fieldsToSet;
                });
            });
        }


        throw new Error('Request type is missing');

    });

}



/**
 * A request modification create new events
 * This function remove events no more linked to the request
 *
 * @param   {CalendarEvent}   newRequest
 * @returns {Promise}  resolve to list of deleted events
 */
function deleteOldEvents(newRequest)
{

    let newEventIds = newRequest.events.map(evt => {
        return evt._id;
    });

    let CalendarEvent = newRequest.model('CalendarEvent');

    return CalendarEvent
    .find({ $and: [
        { _id: { $nin: newEventIds }},
        { request: newRequest._id }
    ]}).exec()
    .then(events => {
        let promises = [];
        events.forEach(event => {
            promises.push(event.remove());
        });

        return Promise.all(promises);
    });
}


/**
 * User id can be provided by account rest service (forced ID) or by admin rest service (use the embeded object)
 */
function getUserId(params)
{
    if (undefined === params.user) {
        throw new Error('Missing mandatory parameter user');
    }

    if (typeof params.user === 'string' || typeof params.user === 'object' && 'ObjectID' === params.user.constructor.name) {
        return params.user;
    }

    if (undefined !== params.user.id && undefined !== params.user.id._id) {
        return params.user.id._id;
    }

    throw new Error('Unexpected object, user.id need to be populated');
}


/**
 * Update/create the request document
 *
 * @param {apiService} service
 * @param {Object} params
 *
 * @return {Promise}
 */
function saveRequest(service, params) {

    const gt = service.app.utility.gettext;
    const postpone = service.app.utility.postpone;

    let RequestModel = service.app.db.models.Request;
    let UserModel = service.app.db.models.User;

    let userDocument;

    let filter = {
        _id: params.id
    };

    filter['user.id'] = getUserId(params);


    /**
     * Save document and add message to service promise
     * @param {Request} document
     * @param {String}  message
     * @param {User} user
     * @return {Promise}
     */
    function end(document, message, user)
    {
        let savedDocument;

        return document.save()
        .then(document => {

            savedDocument = document;

            if (document.absence !== undefined) {
                return saveAbsence.saveEmbedEvents(document);
            }

            if (document.workperiod_recover !== undefined) {
                // create right if no approval
                return saveWorkperiodRecover.settle(userDocument, document);
            }

            if (document.time_saving_deposit !== undefined) {
                return Promise.resolve(null);
            }

            throw new Error('Document without goal');
        })
        .then(() => {
            return deleteOldEvents(savedDocument);
        })
        .then(() => {
            return savedDocument.updateAutoAdjustments();
        })
        .then(() => {
            return postpone(document.updateRenewalsStat.bind(document));
        })
        .then(() => {
            const sendEmail = mail => {
                return mail.send()
                .then(mail => {
                    savedDocument.messages.push(mail._id);
                    return savedDocument.save();
                });
            };

            // if event in waiting state notifty approver
            if (savedDocument.status.created === 'waiting') {
                return pendingapproval(service.app, savedDocument).then(sendEmail);
            }

            // if event created by an administrator for a user, notify him
            if (!params.id && savedDocument.status.created === 'accepted' && !savedDocument.user.id.equals(savedDocument.createdBy.id)) {
                return requestcreated(service.app, savedDocument).then(sendEmail);
            }

            return savedDocument;
        })
        .then(savedDocument => {
            service.resolveSuccessGet(
                savedDocument._id,
                message
            );
        });
    }



    return UserModel.findOne({
        '_id': getUserId(params)
    })
    .populate('roles.account')
    .populate('department')
    .exec()
    .then(user => {

        if (!user) {
            throw new Error('User not found');
        }

        userDocument = user;

        if (user.department && undefined !== params.absence && params.absence.distribution.length > 0) {
            const span = saveAbsence.getPeriodFromDistribution(params.absence.distribution);
            return user.department.checkMinActiveUsers(span.dtstart, span.dtend)
            .then(() => {
                return user;
            });
        }

        return user;
    })
    .then(user => {
        return prepareRequestFields(service, params, user);
    })
    .then(fieldsToSet => {

        if (params.id)
        {
            if (params.modifiedBy === undefined) {
                throw new Error('The modifiedBy parameter is missing');
            }

            return RequestModel.findOne(filter)
            .then(document => {

                document.set(fieldsToSet);
                document.addLog('modify', params.modifiedBy);
                return end(document, gt.gettext('The request has been modified'), userDocument);
            });
        }

        // Initialize fieldsToSet for creation

        if (params.createdBy === undefined) {
            throw new Error('The createdBy parameter is missing');
        }

        fieldsToSet.createdBy = {
            id: params.createdBy._id,
            name: params.createdBy.getName()
        };

        // This can be set only by administrator to fake the creation date
        // to overcome a rule or for unit tests or for screenshots generation
        fieldsToSet.timeCreated = params.timeCreated;

        // save events, because of a mongoose bug
        // if events are not saved before, mongoose set a wrong id in the request document
        // and in the AbsenceElem document

        let evtProm = [];
        if (undefined !== fieldsToSet.events) {
            fieldsToSet.events.forEach(event => {
                evtProm.push(event.save());
            });
        }

        return Promise.all(evtProm)
        .then(() => {

            // no need to update fieldsToSet, mongoose will save the correct event id if the id exists

            var document = new RequestModel();
            document.set(fieldsToSet);
            document.addLog('create', params.createdBy);

            return end(document, gt.gettext('The request has been created'), userDocument);

        });




    }).catch(service.error);
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
