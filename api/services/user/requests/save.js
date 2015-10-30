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

            var saveAbsence = require('./saveAbsence');

            saveAbsence.getCollectionFromDistribution(params.absence.distribution, account).then(function(collection) {

                var promisedDistribution = saveAbsence.saveAbsence(service, user, params.absence, collection);

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

            var saveWorkperiodRecover = require('./saveWorkperiodRecover');
            saveWorkperiodRecover.getFieldsToSet(params.workperiod_recover)
                .then(function(workperiod_recover) {
                fieldsToSet.workperiod_recover = workperiod_recover;
                deferred.resolve(fieldsToSet);
            }, deferred.reject);

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


