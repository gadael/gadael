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
        
        var Gettext = require('node-gettext');
        var gt = new Gettext();

        var filter = {
            _id: params.id,
            'status.deleted': null
        };
        
        if (params.user) {
            filter['user.id'] = params.user;
        }
        
        
        service.app.db.models.Request.findOne(filter, function(err, document) {
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

                } else {

                    // this is an accepted request, need approval to delete

                    document.status.deleted = 'waiting';
                    document.addLog(
                        'wf_sent',
                        params.deletedBy,
                        gt.gettext('Start workflow to delete a confirmed absence')
                    );

                    // TODO: start workflow

                }


                document.save(function(err) {
                    if (service.handleMongoError(err)) {
                        service.success(gt.gettext('The request has been deleted'));

                        var request = document.toObject();
                        request.$outcome = service.outcome;

                        service.deferred.resolve(request);
                    }
                });
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};

