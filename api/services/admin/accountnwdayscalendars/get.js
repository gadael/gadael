'use strict';

exports = module.exports = function(services, app) {

    var service = new services.get(app);

    const gt = app.utility.gettext;

    /**
     * Call the AccountNWDaysCalendar get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {



        service.app.db.models.AccountNWDaysCalendar
        .findOne({ '_id' : params.id }, 'account calendar from to')
        .populate('calendar')
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {
                    service.outcome.success = true;
                    service.deferred.resolve(document);
                } else {
                    service.notFound(gt.gettext('This non working days calendar does not exists for account'));
                }
            }
        });

        return service.deferred.promise;
    };


    return service;
};
