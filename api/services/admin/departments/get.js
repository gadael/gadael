'use strict';


exports = module.exports = function(services, app) {
    
    var Gettext = require('node-gettext');
    var gt = new Gettext();

    var service = new services.get(app);
    






    /**
     * Call the department get service
     * 
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        
        service.app.db.models.Department
        .findOne({ '_id' : params.id})
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {
                    document.getManagers().then(function(arr) {
                        document = document.toObject();
                        document.managers = [];
                        arr.forEach(function(manager) {
                            if (manager.user.id.isActive) {
                                document.managers.push(manager.user.id);
                            }
                        });
                        service.deferred.resolve(document);
                    }, service.error);

                } else {
                    service.notFound(gt.gettext('This department does not exists'));
                }
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};


