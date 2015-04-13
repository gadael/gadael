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
            //TODO error message
            return;
        }

        if (!params.dtstart) {
            //TODO error message
            return;
        }

        if (!params.dtend) {
            //TODO error message
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

                    service.deferred.resolve(user.getCollection(params.dtstart));
                } else {
                    service.notFound(gt.gettext('Failed to load the user document'));
                }
            }
        });


        return service.deferred.promise;
    };


    return service;
};


