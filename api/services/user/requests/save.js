'use strict';

const gt = require('./../../../../modules/gettext');
let Q = require('q');
let getApprovalSteps = require('../../../../modules/getApprovalSteps');
let saveAbsence = require('./saveAbsence');
var saveTimeSavingDeposit = require('./saveTimeSavingDeposit');
var saveWorkperiodRecover = require('./saveWorkperiodRecover');


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
 * @param {apiService} service
 * @param {Object} params
 * @param {User} user               Request owner
 * @return {Promise} promised fieldsToSet object
 */
function prepareRequestFields(service, params, user)
{

    var deferred = Q.defer();





    getApprovalSteps(user).then(approvalSteps => {

        let account = user.roles.account;


        let fieldsToSet = {
            user: {
                id: params.user,
                name: account.user.name
            },
            approvalSteps: approvalSteps
        };

        if (user.department) {
            fieldsToSet.user.department = user.department.name;
        }


        // Set the request status

        if (0 === approvalSteps.length) {
            fieldsToSet.status = {
                created: 'accepted'
            };
        } else {

            fieldsToSet.status = {
                created: 'waiting'
            };
        }



        if (undefined !== params.absence) {

            let collection;

            saveAbsence.getCollectionFromDistribution(params.absence.distribution, account)
            .then(function(rightCollection) {
                collection = rightCollection;
                return saveAbsence.saveAbsenceDistribution(service, user, params.absence, collection);
            })
            .then(distribution => {

                fieldsToSet.events = [];

                // push elements events to the request events

                let d, e, elem;

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

                return fieldsToSet;

            })
            .then(deferred.resolve)
            .catch(deferred.reject);
        }

        if (undefined !== params.time_saving_deposit) {

            if (!Array.isArray(params.time_saving_deposit)) {
                return deferred.reject('Unsupported parameter for time_saving_deposit');
            }

            if (params.time_saving_deposit.length !== 1) {
                return deferred.reject('Unsupported parameter for time_saving_deposit');
            }



            saveTimeSavingDeposit.getFieldsToSet(service, params.time_saving_deposit[0])
            .then(function(tsdFields) {
                fieldsToSet.time_saving_deposit = [tsdFields];
                deferred.resolve(fieldsToSet);
            }, deferred.reject);
        }

        if (undefined !== params.workperiod_recover) {

            if (!Array.isArray(params.workperiod_recover)) {
                return deferred.reject('Unsupported parameter for workperiod_recover');
            }

            if (params.workperiod_recover.length !== 1) {
                return deferred.reject('Unsupported parameter for workperiod_recover');
            }



            saveWorkperiodRecover.getEventsPromise(service, params.events)
            .then(function(events) {
                fieldsToSet.events = events;

                saveWorkperiodRecover.getFieldsToSet(service, params.workperiod_recover[0])
                .then(function(wpFields) {
                    fieldsToSet.workperiod_recover = [wpFields];
                    deferred.resolve(fieldsToSet);
                }, deferred.reject);

            }, deferred.reject);
        }

    }).catch(deferred.reject);


    return deferred.promise;
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

    
    let RequestModel = service.app.db.models.Request;
    let UserModel = service.app.db.models.User;

    let userDocument;

    let filter = {
        _id: params.id
    };

    filter['user.id'] = params.user;


    /**
     * Save document and add message to service promise
     * @param {Request} document
     * @param {String}  message
     * @return {Promise}
     */
    function end(document, message)
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
                return saveWorkperiodRecover.createRight(userDocument, document);
            }

            if (document.time_saving_deposit !== undefined) {
                return Promise.resolve(null);
            }

            throw new Error('Document without goal');


        })
        .then(() => {

            service.resolveSuccess(
                savedDocument,
                message
            );

            return savedDocument;
        });
    }



    return UserModel.findOne({
        '_id': params.user
    }).populate('roles.account').populate('department')
    .exec()
    .then(user => {

        if (!user) {
            throw new Error('User not found');
        }

        userDocument = user;
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
                return end(document, gt.gettext('The request has been modified'));
            });
        }




        if (params.createdBy === undefined) {
            throw new Error('The createdBy parameter is missing');
        }

        fieldsToSet.createdBy = {
            id: params.createdBy._id,
            name: params.createdBy.getName()
        };

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

            return end(document, gt.gettext('The request has been created'));

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


