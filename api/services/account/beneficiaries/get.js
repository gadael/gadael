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


        if (undefined === params || !params.id) {
            service.error('The id parameter is mandatory');
            return service.deferred.promise;
        }

        if (undefined === params || !params.account) {
            service.error('The account parameter is mandatory');
            return service.deferred.promise;
        }


        var Gettext = require('node-gettext');
        var gt = new Gettext();


        service.app.db.models.Account
            .findOne({ _id: params.account})
            .populate('user.id')
            .exec(function(err, account) {



                service.app.db.models.Beneficiary
                .findOne({ '_id' : params.id }, 'right ref document')
                .populate('right')
                .exec(function(err, document) {
                    if (service.handleMongoError(err))
                    {
                        if (document) {

                            document.right.populate('type', function() {

                                var processRenewals = require('./renewals')(account.user.id, account);


                                var rightDocument = document.right;
                                var beneficiary = document.toObject();
                                beneficiary.disp_unit = rightDocument.getDispUnit();


                                rightDocument.getAllRenewals().then(function(renewals) {

                                    /**
                                     * Store available quantity for each accessibles renewals
                                     * renewals with right rules not verified will not be included
                                     */
                                    beneficiary.renewals = [];

                                    /**
                                     * Sum of quantities from the accessibles renewals
                                     */
                                    beneficiary.initial_quantity = 0;

                                    /**
                                     * Sum of quantities from the accessibles renewals
                                     */
                                    beneficiary.consumed_quantity = 0;

                                    /**
                                     * Sum of quantities from the accessibles renewals
                                     */
                                    beneficiary.available_quantity = 0;

                                    processRenewals(rightDocument, beneficiary, renewals, function done(err) {

                                        if (err) {
                                            return service.error(err);
                                        }

                                        beneficiary.right.quantity_dispUnit = rightDocument.getDispUnit(beneficiary.right.quantity);


                                        service.outcome.success = true;
                                        service.deferred.resolve(beneficiary);
                                    });

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
