'use strict';


/**
 * The user request list service
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

    if (params.deleted === undefined) {
        params.deleted = false;
    }

    var find = service.app.db.models.Request.find();
    find.where({ deleted: params.deleted });

    if (params.user)
    {
         find.where({ 'user.id': params.user });
    }


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

        var cols = 'user timeCreated createdBy absence time_saving_deposit workperiod_recover approvalSteps';
        var sortkey = 'timeCreated';
        
        service.resolveQuery(
            query(service, params),
            cols,
            sortkey,
            paginate
        );

        return service.deferred.promise;
    };
    
    
    return service;
};




