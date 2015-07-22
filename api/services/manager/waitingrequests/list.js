'use strict';


/**
 * The Admin request list service
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
    find.where();

    var match = { status: 'waiting' };

    if (params.user) {
         match.approvers = params.user;
    }

    find.where({
         approvalSteps: {
             $elemMatch: match
         }
     });

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
        find.select('user timeCreated createdBy absence time_saving_deposit workperiod_recover approvalSteps');
        find.sort('timeCreated');

        service.resolveQuery(find, paginate);

        return service.deferred.promise;
    };


    return service;
};




