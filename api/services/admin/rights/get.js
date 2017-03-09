'use strict';



exports = module.exports = function(services, app) {

    const gt = app.utility.gettext;

    var service = new services.get(app);

    /**
     * Call the right get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        service.app.db.models.Right
        .findOne({ '_id' : params.id})
        .populate('type')
        .populate('autoAdjustment.types')
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {

                    let right = document.toObject();
                    right.disp_unit = document.getDispUnit();
                    let specialRight = document.getSpecialRight();
                    if (specialRight) {
                        right.specialright = specialRight.getServiceObject();
                    }

                    document.getBeneficiaryRef()
                    .then(beneficiaryRef => {
                        right.beneficiaryRef = beneficiaryRef;
                        return document.getLastRenewal()
                        .then(function(lastRenewal) {
                            right.lastRenewal = lastRenewal;
                            return document.getCurrentRenewal();
                        })
                        .then(function(currentRenewal) {
                            right.currentRenewal = currentRenewal;
                            service.outcome.success = true;
                            service.deferred.resolve(right);
                        });

                    })
                    .catch(function(err) {
                        service.notFound(err);
                    });


                } else {
                    service.notFound(gt.gettext('This absence right does not exists'));
                }
            }
        });

        return service.deferred.promise;
    };


    return service;
};
