'use strict';

const getApprovalSteps = require('../../../../modules/getApprovalSteps');


exports = module.exports = function(services, app) {

    var service = new services.delete(app);

    const gt = app.utility.gettext;
    const postpone = app.utility.postpone;

    /**
     * Call the requests delete service
     *
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        if (null !== service.app.config.company && service.app.config.company.maintenance) {
            return service.forbidden(gt.gettext('Request modifications are not allowed in maintenance mode'));
        }


        var filter = {
            _id: params.id
        };

        if (params.user) {
            filter['user.id'] = params.user;
        }


        function endDelete(document) {
            document.save()
            .then(() => {
                const evtStatus = 'waiting' === document.status.deleted ?
                    'PRECANCEL' :
                    'CANCELLED';

                // cancel all events associated to the request
                document.setEventsStatus(evtStatus);
            })
            .then(() => {
                return postpone(document.updateRenewalsStat.bind(document));
            })
            .then(() => {
                var request = document.toObject();

                service.resolveSuccess(
                    request,
                    gt.gettext('The request has been deleted')
                );
            })
            .catch(service.error);
        }


        service.app.db.models.Request.findOne(filter)
            .populate('user.id')
            .populate('events')
            .exec(function(err, document) {
            if (service.handleMongoError(err)) {


                if (!params.deletedBy) {
                    return service.error('the deletedBy parameter is missing');
                }


                if (null === document) {
                    return service.forbidden(gt.gettext('The request is not accessible'));
                }

                if (document.absence && document.absence.compulsoryLeave) {
                    return service.forbidden(gt.gettext('This leave has been created in a compulsory leave, deletion is not allowed'));
                }


                if ('accepted' !== document.status.created) {
                    document.status.deleted = 'accepted';
                    document.addLog('delete', params.deletedBy);
                    return endDelete(document);
                }

                // this is an accepted request, need approval to delete

                document.status.created = null;
                document.status.deleted = 'waiting';

                document.addLog(
                    'wf_sent',
                    params.deletedBy,
                    gt.gettext('Start workflow to delete a confirmed absence')
                );


                getApprovalSteps(document.user.id)
                .then(function(approvalSteps) {
                    document.approvalSteps = approvalSteps;
                    endDelete(document);
                }, service.error);

            }
        });

        return service.deferred.promise;
    };


    return service;
};
