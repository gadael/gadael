'use strict';


/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

    if (service.needRequiredFields(params, ['calendar', 'from'])) {
        return;
    }

    saveAccountNWDaysCalendar(service, params);
}




/**
 * Get account ID from query
 * @param {saveItemService} service
 * @param {object} params
 * @param {function} next
 */
function getAccount(service, params, next) {

    const gt = service.app.utility.gettext;

    if (params.account) {
        next(params.account);
        return;
    }

    if (!params.user) {
        service.forbidden(gt.gettext('Cant create Account non working days calendar, missing user or account'));
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
                service.forbidden(gt.gettext('The user has no absence account, non working days calendars are only linkable to accounts'));
                return;
            }

            next(user.roles.account);
        }
    });
}





/**
 * Update/create the AccountNWDaysCalendar document
 *
 * @param {saveItemService} service
 * @param {Object} params
 */
function saveAccountNWDaysCalendar(service, params) {

    const gt = service.app.utility.gettext;
    const postpone = service.app.utility.postpone;

    var nwdaysCalendar = service.app.db.models.AccountNWDaysCalendar;
    var util = require('util');

    if (params.id) {
        nwdaysCalendar.findById(params.id)
        .then(document => {

            if (null === document) {
                service.notFound(util.format(gt.gettext('Account non working days calendar document not found for id %s'), params.id));
                return;
            }

            document.calendar 	= params.calendar._id;
            document.from 		= params.from;
            document.to 		= params.to;

            return document.save()
            .then(document =>  {

                return postpone(document.updateUsersStat.bind(document))
                .then(() => {

                    service.resolveSuccessGet(
                        document._id,
                        gt.gettext('The account non working days calendar period has been modified')
                    );

                });

            });

        })
        .catch(service.error);

    } else {

        getAccount(service, params, function(accountId) {

            let document = new nwdaysCalendar();
            document.set({
                account: accountId,
                calendar: params.calendar._id,
                from: params.from,
                to: params.to
            });

            document.save()
            .then(document => {

                return postpone(document.updateUsersStat.bind(document))
                .then(() => {

                    service.resolveSuccessGet(
                        document._id,
                        gt.gettext('The account non working days calendar period has been created')
                    );

                });
            })
            .catch(service.error);


        });
    }
}










/**
 * Construct the account non working days calendar save service
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
