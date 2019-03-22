'use strict';


/**
 * The manager waiting request list service
 */




/**
 * Create the query with filters
 *
 * @param {listItemsService} service
 * @param {array} params      query parameters if called by controller
 *
 * @return {Query}
 */
var query = function(service, params) {


    var find = service.app.db.models.Request.find();

    find.where({ $or:
        [
            { 'status.created': 'waiting' },
            { 'status.deleted': 'waiting' }
        ]
    });

    find.where('status.deleted').ne('accepted');

    var match = { status: 'waiting' };

    if (params.user) {
         match.approvers = params.user;
    }

    find.where({
         approvalSteps: {
             $elemMatch: match
         }
     });

     find.populate('user.id');
     find.populate('events');
     find.populate('absence.distribution');
     find.populate('workperiod_recover.event');

     return find;
};




exports = module.exports = function(services, app) {

    var service = new services.list(app);

    /**
     * Call the requests list service
     *
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params, paginate) {

        var find = query(service, params);
        find.select('user timeCreated createdBy events absence time_saving_deposit workperiod_recover requestLog approvalSteps status');
        find.sort('timeCreated');

        service.resolveQuery(find, paginate, function(err, docs) {
            if (service.handleMongoError(err))
            {
                var docsObj = [];
                var approvers;

                if (undefined !== docs) {

                    for(var i=0; i<docs.length; i++) {

                        approvers = docs[i].getRemainingApproversOnWaitingSteps();

                        if (params.user && -1 === approvers.indexOf(params.user)) {
                            continue;
                        }

                        var reqObj = docs[i].toObject();
                        reqObj.status.title = docs[i].getDispStatus();
                        reqObj.dispType = docs[i].getDispType();
                        docsObj.push(reqObj);
                    }
                }

                service.mongOutcome(err, docsObj);
            }
        });

        return service.deferred.promise;
    };


    return service;
};
