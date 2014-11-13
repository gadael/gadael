'use strict';


exports = module.exports = function(services, app) {
    
    var service = new services.get(app);
    
    /**
     * Call the right get service
     * 
     * @param {Object} params
     * @return {Promise}
     */
    service.call = function(params) {
        
        service.models.Right
        .findOne({ '_id' : params.id}, 'name description type require_approval autoDistribution quantity quantity_unit activeFor activeSpan')
        .populate('type')
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {
                    
                    var right = document.toObject();
                    right.disp_unit = document.getDispUnit();
                    
                    document.getLastRenewal()
                        .then(function(lastRenewal) {
                            right.lastRenewal = lastRenewal;
                            return document.getCurrentRenewal();
                        })
                        .then(function(currentRenewal) {
                            right.currentRenewal = currentRenewal;
                            service.outcome.success = true;
                            service.deferred.resolve(right);
                        })
                        .catch(function(err) {
                            service.notFound(err);
                        });
                    
                    
                } else {
                    service.notFound(service.gt.gettext('This vacation right does not exists'));
                }
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};


