'use strict';


exports = module.exports = function(services, app) {
    
    var service = new services.delete(app);
    
    /**
     * Call the requests delete service
     * 
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        
        const gt = require('./../../../../modules/gettext');

        var filter = {
            _id: params.id,
            'status.deleted': null
        };
        
        if (params.user) {
            filter['user.id'] = params.user;
        }
        
        
        function endDelete(document) {
            document.save(function(err) {
                if (service.handleMongoError(err)) {

                    // cancel all events associated to the request
                    document.setEventsStatus('CANCELLED');
                    var request = document.toObject();

                    service.resolveSuccess(
                        request,
                        gt.gettext('The request has been deleted')
                    );
                }
            });
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

                if ('accepted' !== document.status.created) {
                    document.status.deleted = 'accepted';
                    document.addLog('delete', params.deletedBy);
                    return endDelete(document);
                }

                // this is an accepted request, need approval to delete

                document.status.deleted = 'waiting';
                document.addLog(
                    'wf_sent',
                    params.deletedBy,
                    gt.gettext('Start workflow to delete a confirmed absence')
                );


                var getApprovalSteps = require('../../../../modules/getApprovalSteps');

                getApprovalSteps(document.user.id).then(function(approvalSteps) {
                    document.approvalSteps = approvalSteps;
                    endDelete(document);
                }, service.error);

            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};

