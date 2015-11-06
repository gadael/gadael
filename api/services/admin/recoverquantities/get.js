'use strict';


exports = module.exports = function(services, app) {

    var Gettext = require('node-gettext');
    var gt = new Gettext();

    var service = new services.get(app);

    /**
     * Call the recover quantity get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        service.app.db.models.Department
        .findOne({ '_id' : params.id}, 'name quantity quantity_unit')
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {
                    service.outcome.success = true;
                    service.deferred.resolve(document);
                } else {
                    service.notFound(gt.gettext('This recover quantity does not exists'));
                }
            }
        });

        return service.deferred.promise;
    };


    return service;
};


