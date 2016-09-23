'use strict';



exports = module.exports = function(services, app) {


    const gt = app.utility.gettext;

    var service = new services.get(app);

    /**
     * Call the request get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        var filter = {
            _id: params.id
        };

        if (params.user) {
            filter['approvalSteps.approvers'] = params.user;
        }



        service.app.db.models.Request
        .findOne(filter)
        .populate('events')
        .populate('user.id')
        .populate('absence.distribution')
        .populate('approvalSteps.approvers', null, 'User')
        .populate('requestLog.userCreated.id')
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {

                    let object = document.toObject();
                    object.dispType = document.getDispType();
                    object.status.title = document.getDispStatus();

                    // add dispStatus on steps
                    for (var i=0; i<object.approvalSteps.length; i++) {
                        object.approvalSteps[i].dispStatus = document.approvalSteps[i].getDispStatus();
                    }

                    service.outcome.success = true;
                    service.deferred.resolve(object);
                } else {
                    service.notFound(gt.gettext('This request does not exists'));
                }
            }
        });

        return service.deferred.promise;
    };


    return service;
};
