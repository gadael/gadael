'use strict';

const userComplete = require('../../../../modules/userComplete');


exports = module.exports = function(services, app) {

    const gt = app.utility.gettext;

    var service = new services.get(app);

    /**
     * Call the users get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        service.app.db.models.User
        .findOne({ '_id' : params.id }, 'lastname firstname email isActive department roles timeCreated validInterval image')
        .populate('department')
        .populate('roles.account')
        .populate('roles.admin')
        .populate('roles.manager')
        .exec(function(err, user) {
            if (service.handleMongoError(err))
            {
                if (user) {
                    userComplete(user).then(function(userObj) {
                        service.outcome.success = true;
                        service.deferred.resolve(userObj);
                    });


                } else {
                    service.notFound(gt.gettext('This user does not exists'));
                }
            }
        });

        return service.deferred.promise;
    };


    return service;
};
