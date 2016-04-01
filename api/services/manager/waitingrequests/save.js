'use strict';



/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params)
{
    if (service.needRequiredFields(params, ['id', 'user', 'approvalStep', 'action'])) {
        return;
    }

    if (!params.action.indexOf(['wf_accept', 'wf_reject'])) {
        return service.error('invalid value for action, a manager can only accept or reject a request');
    }

    saveRequest(service, params);
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

    var filter = {
        '_id': params.id
    };

    RequestModel.findOne(filter).exec(function(err, document) {
        if (service.handleMongoError(err)) {

            if (!document) {
                return service.notFound('Request not found');
            }


            var approvalStep = document.approvalSteps.id(params.approvalStep);


            UserModel.findOne({ _id: params.user }).exec(function(err, user) {

                if (service.handleMongoError(err)) {

                    /**
                     * Greater than 0 if more approvers acceptations are required to complete the step
                     * @var {Int}
                     */
                    var remainingApprovers = 0;

                    try {
                        if ('wf_accept' === params.action) {
                            remainingApprovers = document.accept(approvalStep, user, params.comment);
                        }

                        if ('wf_reject' === params.action) {
                            document.reject(approvalStep, user, params.comment);
                        }
                    } catch(e) {
                        return service.forbidden(e.message);
                    }

                    document.save(function(err, request) {

                        if (service.handleMongoError(err)) {

                            request.populate('events', function(err) {

                                if (service.handleMongoError(err)) {

                                    if ('accepted' === request.status.created) {
                                        request.setEventsStatus('CONFIRMED').then(function() {
                                            service.resolveSuccess(
                                                document,
                                                gt.gettext('The request has been confirmed')
                                            );
                                        });
                                        return;
                                    }

                                    if ('rejected' === request.status.created) {
                                        request.setEventsStatus('CANCELLED').then(function() {
                                            service.resolveSuccess(
                                                document,
                                                gt.gettext('The request has been cancelled')
                                            );
                                        });
                                        return;
                                    }


                                    if ('accepted' === request.status.deleted) {
                                        request.setEventsStatus('CANCELLED').then(function() {
                                            service.resolveSuccess(
                                                document,
                                                gt.gettext('The appliquant has requested a delete, the request has been canceled')
                                            );
                                        });
                                        return;
                                    }

                                    if ('rejected' === request.status.deleted) {
                                        request.setEventsStatus('CONFIRMED').then(function() {
                                            service.resolveSuccess(
                                                document,
                                                gt.gettext('The appliquant has requested a delete, the request has been confirmed anyway')
                                            );
                                        });
                                        return;
                                    }

                                    if (remainingApprovers > 0) {
                                        service.resolveSuccess(
                                            document,
                                            gt.gettext('Approval for others approvers are required to complete this step')
                                        );
                                        return;
                                    }

                                    service.resolveSuccess(
                                        document,
                                        gt.gettext('The request has been forwarded to the next approval step')
                                    );

                                }

                            });

                        }
                    });

                }

            });
        }
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


