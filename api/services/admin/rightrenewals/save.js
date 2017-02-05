'use strict';


/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

    const gt = service.app.utility.gettext;

    if (service.needRequiredFields(params, ['right', 'start', 'finish'])) {
        return;
    }

    if (params.start >= params.finish) {
        return service.error(gt.gettext('Finish date must be greater than start date'));
    }

    var RightModel = service.app.db.models.Right;

    RightModel.count({ _id: params.right }).exec((err, count) => {
        if (err) {
            return service.error(err);
        }

        if (0 === count) {
            return service.error('No right found for '+params.right);
        }

        saveRenewal(service, params);
    });


}


/**
 * Update/create the right renewal document
 *
 * @param {apiService} service
 * @param {Object} params
 */
function saveRenewal(service, params) {

    const gt = service.app.utility.gettext;
    var RightRenewalModel = service.app.db.models.RightRenewal;

    var rightId = params.right;
    if (undefined !== params.right._id) {
        rightId = params.right._id;
    }

    let finish = new Date(params.finish);
    finish.setHours(23,59,59,999);

    var fieldsToSet = {
        right: rightId,
        start: params.start,
        finish: finish,
        lastUpdate: new Date()
    };





    if (params.id)
    {
        RightRenewalModel.findOne({ _id: params.id }, function(err, document) {
            if (service.handleMongoError(err))
            {
                document.set(fieldsToSet);
                document.adjustments = document.adjustments.filter(function(a) {
                    return (null !== a.quantity);
                });


                document.save(function(err, document) {

                    if (service.handleMongoError(err)) {

                        service.resolveSuccessGet(
                            document._id,
                            gt.gettext('The right renewal period has been modified')
                        );

                    }

                });


            }
        });

    } else {

        var document = new RightRenewalModel();
        document.set(fieldsToSet);

        document.save(function(err, document) {

            if (service.handleMongoError(err))
            {
                service.resolveSuccessGet(
                    document._id,
                    gt.gettext('The right renewal period has been created')
                );
            }
        });
    }
}










/**
 * Construct the right renewal save service
 * @param   {object}          services list of base classes from apiService
 * @param   {express|object}  app      express or headless app
 * @returns {saveItemService}
 */
exports = module.exports = function(services, app) {

    var service = new services.save(app);

    /**
     * Call the right renewal save service
     *
     * @param {Object} params
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        validate(service, params);
        return service.deferred.promise;
    };


    return service;
};
