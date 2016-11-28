'use strict';

const pendingapproval = require('../../../../modules/emails/pendingapproval');
const requestaccepted = require('../../../../modules/emails/requestaccepted');
const requestrejected = require('../../../../modules/emails/requestrejected');


/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params)
{
    const gt = service.app.utility.gettext;

    if (service.needRequiredFields(params, ['id', 'user', 'approvalStep', 'action'])) {
        return;
    }

    if (null !== service.app.config.company && service.app.config.company.maintenance) {
        return service.forbidden(gt.gettext('Request modifications are not allowed in maintenance mode'));
    }

    if (!params.action.indexOf(['wf_accept', 'wf_reject'])) {
        return service.error('invalid value for action, a manager can only accept or reject a request');
    }

    saveRequest(service, params);
}



/**
 * Send mail to next approvers or request owner
 * @param {Object} app Express
 * @param {Request} request The saved request
 * @param {Number} remainingApprovers
 * @return {Promise}
 */
function sendEmail(app, request, remainingApprovers)
{
    if ('accepted' === request.status.created || 'accepted' === request.status.deleted) {
        return requestaccepted(app, request).send();
    }

    if ('rejected' === request.status.created || 'rejected' === request.status.deleted) {
        return requestrejected(app, request).send();
    }

    if (remainingApprovers > 0) {
        return pendingapproval(app, request).send();
    }

    throw new Error('Unexpected request, there are no remaining approvers but the request is not accepted nor rejected');
}




/**
 * Update/create the request document
 *
 * @param {apiService} service
 * @param {Object} params
 */
function saveRequest(service, params) {

    const gt = service.app.utility.gettext;

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

                    document.save()
                    .then(request => {

                        return request.populate('events')
                        .execPopulate();
                    })
                    .then(request => {

                        try {
                            sendEmail(service.app, request, remainingApprovers);
                            // the output promise of sendEmail is ignored
                            // the process must end successfully also when email fail
                        } catch(e) {
                            // errors are catched here to prevent insertion in promise result
                        }


                        if ('accepted' === request.status.created) {
                            request.setEventsStatus('CONFIRMED').then(function() {
                                service.resolveSuccessGet(
                                    document._id,
                                    gt.gettext('The request has been confirmed')
                                );
                            });
                            return;
                        }

                        if ('rejected' === request.status.created) {
                            request.setEventsStatus('CANCELLED').then(function() {
                                service.resolveSuccessGet(
                                    document._id,
                                    gt.gettext('The request has been cancelled')
                                );
                            });
                            return;
                        }


                        if ('accepted' === request.status.deleted) {
                            request.setEventsStatus('CANCELLED').then(function() {
                                service.resolveSuccessGet(
                                    document._id,
                                    gt.gettext('The appliquant has requested a delete, the request has been canceled')
                                );
                            });
                            return;
                        }

                        if ('rejected' === request.status.deleted) {
                            request.setEventsStatus('CONFIRMED').then(function() {
                                service.resolveSuccessGet(
                                    document._id,
                                    gt.gettext('The appliquant has requested a delete, the request has been confirmed anyway')
                                );
                            });
                            return;
                        }

                        if (remainingApprovers > 0) { // remaining approvers on the same step
                            service.resolveSuccessGet(
                                document._id,
                                gt.gettext('Your approval has been saved, others approvals are required to complete this step')
                            );
                            return;
                        }

                        service.resolveSuccessGet(
                            document._id,
                            gt.gettext('The request has been forwarded to the next approval step')
                        );
                    })
                    .catch(service.error);

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
