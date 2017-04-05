'use strict';

const renewalsMod = require('./renewals');


/**
 * The user account beneficiaries list service
 */








/**
 * Export list service
 * @param   {Object} services  base classes from apiService
 * @param   {express|object} app      express or headless app
 * @returns {listItemsService}
 */
exports = module.exports = function(services, app) {

    var service = new services.list(app);


    function getOwnerPromise(params)
    {
        let Account = service.app.db.models.Account;
        let User = service.app.db.models.User;

        if (params.user instanceof User) {

            if (!params.user.roles.account) {
                return Promise.reject(new Error('No absence account for this user'));
            }

            return Promise.resolve({
                user: params.user,
                account: params.user.roles.account
            });
        }


        if (typeof params.user === 'string' || params.user instanceof String) {
            return User.findOne()
            .where('_id', params.user)
            .populate('roles.account')
            .exec()
            .then(user => {
                if (!user.roles.account) {
                    return Promise.reject(new Error('No absence account for this user'));
                }
                return {
                    user: user,
                    account: user.roles.account
                };
            });
        }

        if (typeof params.account === 'string' || params.account instanceof String) {
            return Account.findOne({ _id: params.account })
            .populate('user.id')
            .exec()
            .then(account => {
                return {
                    user: account.user.id,
                    account: account
                };
            });
        }

        return Promise.reject(new Error('Wrong parameter type for user or account'));
    }



    /**
     * Create the query with filters
     *
     * @param {array}    params query parameters if called by controller
     *                          params.account     Mandatory parameter to get the account beneficaries
     *                          [params.date]      Optional moment for collection selection
     * @param {function} next
     *
     */
    function getQuery(params, next) {


        var find = service.app.db.models.Beneficiary.find({});
        find.populate('right');

        getOwnerPromise(params)
        .then(owner => {

            let docs = [owner.user._id];
            let collectionPromise;

            if (undefined !== params.date) {
                collectionPromise = owner.account.getCollection(new Date(params.date));
            } else {
                collectionPromise = owner.account.getCurrentCollection();
            }

            collectionPromise
            .then(rightCollection => {

                if (rightCollection) {
                    docs.push(rightCollection._id);
                }

                find.where('document').in(docs);

                next(find, owner);
            });


        })
        .catch(service.error);

    }





     /**
     *
     * @param {Account} account
     * @param {User} user
     * @param {Array} beneficiaries array of mongoose documents
     * @param {Date} moment
     *
     * @return {Promise}    resolve to array of beneficiaries objects
     */
    function resolveAccountRights(account, user, beneficiaries, moment)
    {

        let processRenewals = renewalsMod(user, account);

        let promises = beneficiaries.map(beneficiaryDocument => {
            let rightDocument = beneficiaryDocument.right;
            let beneficiary = beneficiaryDocument.toObject();
            beneficiary.disp_unit = rightDocument.getDispUnit();

            return rightDocument.getAllRenewals()
            .then(renewals => {
                return processRenewals(rightDocument, beneficiary, renewals, moment);
            });
        });

        return Promise.all(promises);
    }






    /**
     * Call the beneficiaries list service
     *
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params, paginate) {

        if (!params.user && !params.account) {
            service.error('The user or account parameter is mandatory');
            return service.deferred.promise;
        }

        let moment = new Date();
        if (undefined !== params.moment) {
            moment = new Date(params.moment);
        }

        getQuery(params, function(query, owner) {


            query.select('right document ref');
            query.sort('right.name');

            var populatedTypePromises = [];

            service.resolveQuery(
                query,
                paginate,
                function(err, docs) {
                    if (service.handleMongoError(err))
                    {
                        // populate type in right, wait for resolution of all promises before
                        // resolving the service



                        for(var i=0; i<docs.length; i++) {
                            populatedTypePromises.push(docs[i].right.populate('type').execPopulate());
                        }

                        Promise.all(populatedTypePromises)
                        .then(function() {
                            return resolveAccountRights(owner.account, owner.user, docs, moment);
                        })
                        .then(beneficiaries => {
                            service.outcome.success = true;
                            service.deferred.resolve(beneficiaries);
                        })
                        .catch(service.error);
                    }
                }
            );
        });


        return service.deferred.promise;
    };


    return service;
};
