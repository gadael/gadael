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
 * @param {apiService} service
 * @param {Object} params
 * @param {User} user               Request owner
 * @return {Promise} promised fieldsToSet object
 */
function prepareRequestFields(service, params, user)
{
    var Q = require('q');
    var deferred = Q.defer();
    let getApprovalSteps = require('../../../../modules/getApprovalSteps');




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

            let saveAbsence = require('./saveAbsence');

            saveAbsence.getCollectionFromDistribution(params.absence.distribution, account).then(function(collection) {

                let promisedDistribution = saveAbsence.saveAbsence(service, user, params.absence, collection);

                promisedDistribution.then(distribution => {

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

            if (!Array.isArray(params.time_saving_deposit)) {
                return deferred.reject('Unsupported parameter for time_saving_deposit');
            }

            if (params.time_saving_deposit.length !== 1) {
                return deferred.reject('Unsupported parameter for time_saving_deposit');
            }

            var saveTimeSavingDeposit = require('./saveTimeSavingDeposit');

            saveTimeSavingDeposit.getFieldsToSet(service, params.time_saving_deposit[0]).then(function(tsdFields) {
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

            var saveWorkperiodRecover = require('./saveWorkperiodRecover');

            saveWorkperiodRecover.getEventsPromise(service, params.events).then(function(events) {
                fieldsToSet.events = events;

                saveWorkperiodRecover.getFieldsToSet(service, params.workperiod_recover[0]).then(function(wpFields) {
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
 */  
function saveRequest(service, params) {

    const gt = require('./../../../../modules/gettext');

    
    var RequestModel = service.app.db.models.Request;
    var UserModel = service.app.db.models.User;

    UserModel.findOne({
        '_id': params.user
    }).populate('roles.account').populate('department')
    .exec(function(err, user) {

        if (err) {
            return service.error(err);
        }

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


                        if (document.absence !== undefined) {
                            require('./saveAbsence').saveEmbedEvents(service, document);
                        }

                        if (document.workperiod_recover !== undefined) {
                            // create right if no approval
                            require('./saveWorkperiodRecover').createRight(user, document);
                        }

                        // Absence: Do not wait for event update?
                        // worperiod recover: Do not wait for right creation?

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


