'use strict';


exports = module.exports = function(services, app) {

    var gt = require('./../../../../modules/gettext');


    var service = new services.delete(app);

    /**
     * Call the recover quantity delete service
     *
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {


        service.app.db.models.RecoverQuantity.findById(params.id, function (err, document) {
            if (service.handleMongoError(err)) {

                if (!document) {
                    return service.notFound(gt.gettext('the recover quantity does not exists'));
                }

                document.remove(function(err) {
                    if (service.handleMongoError(err)) {
                        service.success(gt.gettext('The recover quantity has been deleted'));

                        var recoverQuantity = document.toObject();
                        recoverQuantity.$outcome = service.outcome;

                        service.deferred.resolve(recoverQuantity);
                    }
                });
            }
        });

        return service.deferred.promise;
    };


    return service;
};

