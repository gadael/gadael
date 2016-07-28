'use strict';

const gt = require('./../../../../modules/gettext');


exports = module.exports = function(services, app) {

    var service = new services.get(app);

    /**
     * Call the request get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {


        service.app.db.models.User.findOne(
            { '_id' : params.user },
            'image firstname lastname email roles notify google.calendar')
        .populate('roles.account', 'notify')
        .exec(
            function(err, document) {

            if (service.handleMongoError(err))
            {

                if (!document) {
                    return service.notFound(gt.gettext('This user does not exists'));
                }


                service.outcome.success = true;
                service.deferred.resolve(document);
            }
        });

        return service.deferred.promise;
    };


    return service;
};


