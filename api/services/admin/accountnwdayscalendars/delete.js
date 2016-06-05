'use strict';


const gt = require('./../../../../modules/gettext');






exports = module.exports = function(services, app) {

    var service = new services.delete(app);


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
            service.forbidden(gt.gettext('Delete a non working days calendar period allready started is not allowed'));
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


        service.app.db.models.AccountNWDaysCalendar.findById(params.id, function (err, document) {
            if (service.handleMongoError(err)) {

                if (!validate(document)) {
                    return;
                }

                document.remove(function(err) {
                    if (service.handleMongoError(err)) {
                        service.success(gt.gettext('The non working days has been removed from account'));

                        var accountCalendar = document.toObject();
                        accountCalendar.$outcome = service.outcome;

                        service.deferred.resolve(accountCalendar);
                    }
                });
            }
        });

        return service.deferred.promise;
    };


    return service;
};

