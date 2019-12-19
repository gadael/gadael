'use strict';





exports = module.exports = function(services, app) {

    var service = new services.delete(app);

    const gt = app.utility.gettext;

    /**
     * Validate before delete
     * @param   {AccountNWDaysCalendar}  document mongoose document
     * @returns {Boolean}
     */
    function validate(document) {

        if (!document) {
            service.notFound(gt.gettext('this non working days calendar does not exists or is not linked to account'));
            return false;
        }

        if (document.from < new Date()) {
            service.forbidden(gt.gettext('Delete a non working days calendar period already started is not allowed'));
            return false;
        }

        return true;
    }




    /**
     * Call the account non working days calendar delete service
     *
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        service.app.db.models.AccountNWDaysCalendar.findById(params.id)
        .then(document => {

            if (!validate(document)) {
                return;
            }

            return service.get(params.id)
            .then(object => {

                return document.remove()
                .then(() => {
                    service.resolveSuccess(object, gt.gettext('The non working days has been removed from account'));
                });
            });
        })
        .catch(service.error);

        return service.deferred.promise;
    };


    return service;
};
