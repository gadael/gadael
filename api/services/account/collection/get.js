'use strict';

exports = module.exports = function(services, app) {

    var service = new services.get(app);

    const gt = app.utility.gettext;

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
            return service.deferred.promise;
        }

        if (!params.dtstart) {
            service.error(gt.gettext('dtstart parameter is mandatory'));
            return service.deferred.promise;
        }

        if (!params.dtend) {
            service.error(gt.gettext('dtend parameter is mandatory'));
            return service.deferred.promise;
        }

        service.app.db.models.User.findOne()
        .where('_id', params.user)
        .populate('roles.account')
        .exec(function(err, user) {
            if (service.handleMongoError(err))
            {
                if (!user) {
                    service.notFound(gt.gettext('Failed to load the user document'));
                    return service.deferred.promise;
                }


                var today = new Date();

                user.getEntryAccountCollections(params.dtstart, params.dtend, today).then(function(arr) {
                    if (arr.length > 1) {
                        return service.error(gt.gettext('This period is invalid because it covers more than one collection attribution'));
                    }

                    if (arr.length === 0) {
                        return service.error(gt.gettext('There is no collection defined for this period'));
                    }

                    service.deferred.resolve(arr[0].rightCollection);

                }, function(err) {
                    service.deferred.reject(err);
                });

            }
        });


        return service.deferred.promise;
    };


    return service;
};
