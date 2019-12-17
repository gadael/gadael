'use strict';

/**
 * Delete/recreate list of lunchs for one month
 * @param {apiService} service
 * @param {Object} params
 */
function refreshMonth(service, params) {
    const gt = service.app.utility.gettext;
    const LunchModel = service.app.db.models.Lunch;
    const AccountModel = service.app.db.models.Account;

    const from = new Date(params.year, params.month, 1, 0, 0, 0, 0);
    const to = new Date(params.year, params.month+1, 1, 0, 0, 0, 0);

    AccountModel.findOne()
    .where('user.id', params['user.id'])
    .then(account => {
        if (isNaN(from.getTime()) || isNaN(to.getTime())) {
            throw new Error(gt.gettext('Invalid date'));
        }
        if (null === account) {
            throw new Error(gt.gettext('Account not found from user ID'));
        }
        if (to < account.lunch.createdUpTo) {
            console.log(to);
            console.log(account.lunch.createdUpTo);
            throw new Error(gt.gettext('The month to refresh must be the last created month'));
        }

        return LunchModel.deleteMany({ day: { $gte: from, $lte: to }, 'user.id': params['user.id'] })
        .exec()
        .then(() => {
            account.lunch.createdUpTo = from;
            account.lunch.createdUpTo.setMilliseconds(from.getMilliseconds() -1);
            return account.save();
        })
        .then(() => {
            return account.saveLunchBreaks();
        })
        .then(() => {
            service.resolveSuccess(
                params,
                gt.gettext('The month has been refreshed')
            );
        });
    })
    .catch(service.error);
}

/**
 * Construct the lunchs save service
 * @param   {object}          services list of base classes from apiService
 * @param   {express|object}  app      express or headless app
 * @returns {saveItemService}
 */
exports = module.exports = function(services, app) {
    const service = new services.save(app);

    /**
     * Call the lunch refresh month service
     *
     * @param {Object} params
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        refreshMonth(service, params);
        return service.deferred.promise;
    };

    return service;
};
