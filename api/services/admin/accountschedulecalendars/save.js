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

    saveAccountScheduleCalendar(service, params);
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
        service.forbidden(gt.gettext('Cant create AccountScheduleCalendar, missing user or account'));
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
                service.forbidden(gt.gettext('The user has no absences account, schedule calendars are only linkable to accounts'));
                return;
            }

            next(user.roles.account);
        }
    });
}





/**
 * Update/create the AccountScheduleCalendar document
 *
 * @param {saveItemService} service
 * @param {Object} params
 */
function saveAccountScheduleCalendar(service, params) {

    const gt = service.app.utility.gettext;
    const postpone = service.app.utility.postpone;

    var scheduleCalendar = service.app.db.models.AccountScheduleCalendar;
    var util = require('util');

    if (params.id) {
        scheduleCalendar.findById(params.id, function(err, document) {
            if (service.handleMongoError(err)) {
                if (null === document) {
                    service.notFound(util.format(gt.gettext('AccountScheduleCalendar document not found for id %s'), params.id));
                    return;
                }


                document.calendar 	= params.calendar._id;
                document.from 		= params.from;
                document.to 		= params.to;

                document.save()
                .then(document => {

                    return postpone(document.updateUsersStat.bind(document))
                    .then(() => {

                        service.resolveSuccessGet(
                            document._id,
                            gt.gettext('The account schedule period has been modified')
                        );
                    });
                })
                .catch(service.error);
            }
        });

    } else {

        getAccount(service, params, function(accountId) {

            let document = new scheduleCalendar();
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
                        gt.gettext('The account schedule calendar period has been created')
                    );

                });
            })
            .catch(service.error);


        });
    }
}










/**
 * Construct the account schedule calendar save service
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
