'use strict';


exports = module.exports = function(services, app) {
    
    var Q = require('q');
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
        .populate('parent')
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {

                    var managersPromise = document.getManagers();
                    var subDepartmentsPromise = document.getSubTree();

                    Q.all([managersPromise, subDepartmentsPromise]).then(function(arr) {
                        document = document.toObject();
                        document.managers = [];
                        document.subDepartments = [];

                        arr[0].forEach(function(manager) {
                            if (manager.user.id.isActive) {
                                document.managers.push(manager.user.id);
                            }
                        });

                        arr[1].forEach(function(subdep) {
                            document.subDepartments.push(subdep);
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


