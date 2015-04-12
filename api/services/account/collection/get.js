'use strict';


exports = module.exports = function(services, app) {


    var Gettext = require('node-gettext');
    var gt = new Gettext();


    var service = new services.get(app);

    /**
     * Call the request get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        // get user account from the user param

        if (!params.user) {
            //TODO
            return;
        }

        if (!params.dtstart) {
            return;
        }

        if (!params.dtend) {
            return;
        }

        service.app.db.models.User
        .populate('roles.account')
        .where('_id').is(params.user)
        .exec(function(err, user) {
            if (service.handleMongoError(err))
            {
                if (user) {

                    // TODO return the collection object from dtstart, dtend
                    // return error if collection do not cover the whole period
                    // return error if more than one collection on the period

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


