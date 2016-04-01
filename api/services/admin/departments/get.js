'use strict';


exports = module.exports = function(services, app) {
    
    var Q = require('q');
    const gt = require('./../../../../modules/gettext');

    var service = new services.get(app);
    
    /**
     * @param {Object} department       Department document converted to object
     * @param {Array}  managers
     */
    function addManagers(department, managers) {

        department.managers = [];

        managers.forEach(function(manager) {
            if (manager.user.id.isActive) {
                department.managers.push(manager.user.id);
            }
        });
    }



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

                    var ancestorsPromise = document.getAncestors();
                    var managersPromise = document.getManagers();
                    var subDepartmentsPromise = document.getSubTree();

                    Q.all([managersPromise, subDepartmentsPromise, ancestorsPromise]).then(function(arr) {
                        document = document.toObject();
                        document.ancestors = [];
                        document.children = [];

                        addManagers(document, arr[0]);


                        arr[1].forEach(function(subdep) {
                            document.children.push(subdep);
                        });

                        var ancestorsManagersPromises = [];

                        arr[2].forEach(function(ancdep) {
                            ancestorsManagersPromises.push(ancdep.getManagers());
                            document.ancestors.push(ancdep.toObject());
                        });

                        // get managers for each ancestors

                        Q.all(ancestorsManagersPromises).then(function(ancestorsManagers) {
                            for (var i=0; i<ancestorsManagers.length; i++) {
                                addManagers(document.ancestors[i], ancestorsManagers[i]);
                            }

                            service.deferred.resolve(document);

                        }, service.error);


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


