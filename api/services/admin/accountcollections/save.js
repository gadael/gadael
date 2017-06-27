'use strict';


/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

    // account or user
    if (service.needRequiredFields(params, ['rightCollection', 'from'])) {
        return;
    }

    saveAccountCollection(service, params);
}




/**
 * Get account ID from query
 * @param {saveItemService} service
 * @param {object} params
 * @param {function} next
 */
function getAccount(service, params, next) {

    const gt = service.app.utility.gettext;

    if (params.account && params.account._id) {
        next(params.account._id);
        return;
    }

    if (!params.user) {
        service.forbidden(gt.gettext('Cant create accountCollection, missing user or account'));
        return;
    }


    // find account from user
    service.app.db.models.User.findById(params.user, function(err, user) {
        if (service.handleMongoError(err)) {

            if (!user) {
                service.notFound(gt.gettext('User not found'));
                return;
            }

            if (!user.roles.account) {
                service.forbidden(gt.gettext('The user has no absence account, collections are only linkable to accounts'));
                return;
            }

            next(user.roles.account);
        }
    });
}





/**
 * Update/create the AccountCollection document
 *
 * @param {saveItemService} service
 * @param {Object} params
 */
function saveAccountCollection(service, params) {

    const gt = service.app.utility.gettext;
    const postpone = service.app.utility.postpone;

    var AccountCollection = service.app.db.models.AccountCollection;
    var util = require('util');

    if (params.from) {
        params.from = new Date(params.from);
        params.from.setHours(0,0,0,0);
    }

    if (params.to) {
        params.to = new Date(params.to);
        params.to.setHours(23,59,59,999);
    }


    if (params._id) {

        AccountCollection.findById(params._id)
        .then(document => {

            if (null === document) {
                service.notFound(util.format(gt.gettext('AccountCollection document not found for id %s'), params.id));
                return;
            }

            document.rightCollection 	= params.rightCollection._id;
            document.from 				= params.from;
            document.to 				= params.to;

            return document.save()
            .then(document => {

                return postpone(document.updateUserStat.bind(document))
                .then(() => {

                    service.resolveSuccessGet(
                        document._id,
                        gt.gettext('The account collection has been modified')
                    );
                });
            });

        })
        .catch(service.error);

    } else {

        getAccount(service, params, function(accountId) {

            let ac = new AccountCollection();
            ac.set({
                account: accountId,
                rightCollection: params.rightCollection._id,
                from: params.from,
                to: params.to
            });

            ac.save()
            .then(document => {

                return postpone(document.updateUserStat.bind(document))
                .then(() => {
                    service.resolveSuccessGet(
                        document._id,
                        gt.gettext('The account collection has been created')
                    );
                });
            })
            .catch(service.error);

        });
    }
}










/**
 * Construct the AccountCollection save service
 * @param   {object}          services list of base classes from apiService
 * @param   {express|object}  app      express or headless app
 * @returns {saveItemService}
 */
exports = module.exports = function(services, app) {

    var service = new services.save(app);

    /**
     * Call the calendar save service
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
