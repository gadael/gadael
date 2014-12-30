'use strict';


exports = module.exports = function(services, app) {
    
    var service = new services.get(app);
    
    /**
     * Call the beneficiaries get service
     * 
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        

        var Gettext = require('node-gettext');
        var gt = new Gettext();

        service.app.db.models.Beneficiary
        .findOne({ '_id' : params.id }, 'right ref document')
        .populate('right')
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {
                    service.outcome.success = true;
                    service.deferred.resolve(document);
                } else {
                    service.notFound(gt.gettext('This right does not exists for account or collection'));
                }
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};
