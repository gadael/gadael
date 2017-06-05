'use strict';

const requestdateparams = require('../../../../modules/requestdateparams');

/**
 * The user account rights list service
 * Get available rights beetween two dates
 *
 * right must be available on dtstart to be included in the results
 * total available quantity on accoutright is computed using the renwals in the period between dtstart and dtend
 * the period given as parameter is the future absence request
 *
 * To get the list of available right on the current date, the accountbeneficiaries service shoud be used
 */






/**
 * Create the service
 * @param   {Object} services
 * @param   {Object} app
 * @returns {listItemsService}
 */
exports = module.exports = function(services, app)
{

    var service = new services.list(app);




    /**
     *
     * @param {Document} user
     * @param {Array}    rights array of mongoose documents
     * @param {Date}     dtstart
     * @param {Date}     dtend
     */
    function resolveAccountRights(user, rights, dtstart, dtend)
    {
        var async = require('async');

        /**
         * Get the promise for the available quantity
         * @param   {Right} right
         * @param   {RightRenewal} renewal
         * @returns {Promise|null} resolve to a number
         */
        function getRenewalAvailableQuantity(right, renewal) {

            if (user.roles.account.arrival > renewal.finish) {
                return null;
            }


            return right.validateRules(renewal, user, dtstart, dtend)
            .then(result => {
                if (true !== result) {
                    return null;
                }

                return renewal.getUserAvailableQuantity(user);
            });
        }








        var output = [];


        /**
         * add renewals into the right object
         * @param {Right} rightDocument
         * @param {object} right
         * @param {Array} renewals
         * @param {function} callback
         */
        function processRiRenewals(rightDocument, right, renewals, callback)
        {
            right.errors = [];

            async.each(renewals, function(renewalDocument, renewalCallback) {
                var p = getRenewalAvailableQuantity(rightDocument, renewalDocument);

                if (null === p) {
                    // no error but the right is discarded in this renewal because of the rules or missing renewal
                    return renewalCallback();
                }

                p.then(function(quantity) {

                    if (null !== quantity) {
                        var renewalObj = renewalDocument.toObject();
                        renewalObj.available_quantity = quantity;
                        right.renewals.push(renewalObj);
                        right.available_quantity += quantity;
                    }

                    renewalCallback();

                })
                .catch(err => {
                    // if one renewal fail, we will have an error on the right object
                    right.errors.push({
                        renewal: renewalDocument,
                        error: err.message
                    });

                    renewalCallback();
                });

            }, callback);
        }


        // async.eachSeries is used instead of async.each to maintain order in the output variable
        async.eachSeries(rights, function(rightDocument, cb) {

            var right = rightDocument.toObject();
            right.disp_unit = rightDocument.getDispUnit();



            rightDocument.getAllRenewals().then(function(renewals) {

                /**
                 * Store available quantity for each accessibles renewals
                 * renewals with right rules not verified will not be included
                 */
                right.renewals = [];

                /**
                 * Sum of quantities from the accessibles renewals
                 */
                right.available_quantity = 0;

                processRiRenewals(rightDocument, right, renewals, function done(err) {

                    if (err) {
                        return cb(err);
                    }

                    if (right.renewals.length > 0) {
                        right.available_quantity_dispUnit = rightDocument.getDispUnit(right.available_quantity);
                        output.push(right);
                    }

                    cb();
                });

            }).catch(cb);


        }, function(err) {


            if (err) {
                return service.error(err);
            }

            service.outcome.success = true;
            service.deferred.resolve(output);
        });
    }



    /**
     * Populate type in all rights
     * @param {Array} rights
     * @return {Promise}
     */
    function populateTypes(rights) {
        let promisedPopulate = [];

        // populate right.type
        rights.forEach(right => {
            promisedPopulate.push(right.populate('type').execPopulate());
        });

        return Promise.all(promisedPopulate);
    }



    /**
     * Update groupTitle property with name if not set in type document
     * @param {Array} rights
     */
    function addTypesGroupTitle(rights) {
        rights.forEach(right => {
            if (undefined !== right.type) {
                right.type.groupTitle = right.type.getGroupTitle();
            }
        });
    }






    /**
     * Call the account rights list service
     *
     * @param {Object} params
     *                     params.dtstart
     *                     params.dtend
     *                     params.user
     *
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        if (params.dtstart) {
            params.dtstart = new Date(params.dtstart);
        }

        if (params.dtend) {
            params.dtend = new Date(params.dtend);
        }


        var checkParams = requestdateparams(app);

        if (!checkParams(service, params)) {
            return service.deferred.promise;
        }


        // get user account document for the user param

        service.app.db.models.User.find({ _id: params.user })
        .populate('roles.account')
        .exec(function(err, users) {

            if (service.handleMongoError(err)) {

                if (0 === users.length) {
                    return service.notFound('User not found for '+params.user);
                }

                var account = users[0].roles.account;

                if (!account) {
                    return service.notFound('Account not found for user');
                }


                account.getRights(params.dtstart)
                .then(function(rights) {



                    if (undefined !== params.activeFor) {
                        rights = rights.filter(right => {
                            return (right.activeFor[params.activeFor] === true);
                        });
                    }

                    populateTypes(rights).then(() => {
                        addTypesGroupTitle(rights);
                        resolveAccountRights(users[0], rights, params.dtstart, params.dtend);
                    }).catch(service.error);

                }).catch(service.notFound);

            } else {
                service.notFound('User not found for '+params.user);
            }
        });


        return service.deferred.promise;
    };


    return service;
};
