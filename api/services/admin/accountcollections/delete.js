'use strict';








exports = module.exports = function(services, app) {
    
    var service = new services.delete(app);
    
    var gt = require('./../../../../modules/gettext');
    
    
    /**
     * Validate before delete
     * @param   {AccountCollection}  document mongoose document
     * @returns {Boolean}
     */
    function validate(document) {

        if (!document) {
            service.notFound(gt.gettext('this collection does not exists or is not linked to account'));
            return false;
        }

        if (document.from < new Date()) {
            service.forbidden(gt.gettext('Delete a collection allready started is not allowed'));
            return false;
        }

        return true;
    }
    
    
    
    
    /**
     * Call the account collections delete service
     * 
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        
        
        service.app.db.models.AccountCollection.findById(params.id, function (err, document) {
            if (service.handleMongoError(err)) {
                
                if (!validate(document)) {
                    return;
                }
                
                document.remove(function(err) {
                    if (service.handleMongoError(err)) {
                        service.success(gt.gettext('The collection has been removed from account'));
                        
                        var accountCollection = document.toObject();
                        accountCollection.$outcome = service.outcome;
                        
                        service.deferred.resolve(accountCollection);
                    }
                });
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};

