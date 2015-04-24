'use strict';


exports = module.exports = function(services, app) {


    var Gettext = require('node-gettext');
    var gt = new Gettext();


    var service = new services.get(app);

    /**
     * return the collection if dtstart and dtend are in the accountCollection from-to interval
     * And if the current date is in the createEntriesFrom-createEntriesTo interval
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        // get user account from the user param

        if (!params.user) {
            service.error(gt.gettext('user parameter is mandatory'));
            return;
        }

        if (!params.dtstart) {
            service.error(gt.gettext('dtstart parameter is mandatory'));
            return;
        }

        if (!params.dtend) {
            service.error(gt.gettext('dtend parameter is mandatory'));
            return;
        }

        service.app.db.models.User
        .populate('roles.account')
        .where('_id').is(params.user)
        .exec(function(err, user) {
            if (service.handleMongoError(err))
            {
                if (user) {

                    /**
                     * @todo error management
                     *
                     * return error if collection do not cover the whole period
                     * return error if more than one collection on the period
                     */

                    var today = new Date();
                    var account = user.roles.account;

                    service.deferred.resolve(user.getAccountCollections(params.dtstart, params.dtend));

                    //service.deferred.resolve(account.getValidCollectionForPeriod(params.dtstart, params.dtend, today));
                } else {
                    service.notFound(gt.gettext('Failed to load the user document'));
                }
            }
        });


        return service.deferred.promise;
    };


    return service;
};


