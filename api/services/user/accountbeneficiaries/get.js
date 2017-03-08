'use strict';

const renewalsMod = require('./renewals');


exports = module.exports = function(services, app) {

    var service = new services.get(app);

    const gt = app.utility.gettext;


    /**
     * Call the beneficiaries get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {


        if (undefined === params || !params.id) {
            service.error('The id parameter is mandatory');
            return service.deferred.promise;
        }

        if (undefined === params || !params.account) {
            service.error('The account parameter is mandatory');
            return service.deferred.promise;
        }

        let moment = new Date();
        if (undefined !== params && params.moment) {
            moment = new Date(params.moment);
        }


        service.app.db.models.Account
            .findOne({ _id: params.account})
            .populate('user.id')
            .exec(function(err, account) {



                service.app.db.models.Beneficiary
                .findOne({ '_id' : params.id })
                .populate('right')
                .exec(function(err, document) {
                    if (service.handleMongoError(err))
                    {
                        if (document) {

                            document.right.populate('type', function() {

                                var processRenewals = renewalsMod(account.user.id, account);


                                var rightDocument = document.right;
                                var beneficiary = document.toObject();
                                beneficiary.disp_unit = rightDocument.getDispUnit();


                                rightDocument.getAllRenewals().then(function(renewals) {


                                    processRenewals(rightDocument, beneficiary, renewals, moment)
                                    .then(beneficiary => {
                                        service.outcome.success = true;
                                        service.deferred.resolve(beneficiary);
                                    })
                                    .catch(service.error);

                                });

                            });

                        } else {
                            service.notFound(gt.gettext('This beneficiary does not exists for account or collection'));
                        }
                    }
                });
            });

        return service.deferred.promise;
    };


    return service;
};
