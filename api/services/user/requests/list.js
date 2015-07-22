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

    if (params['status.deleted'] === undefined) {
        params['status.deleted'] = null;
    }

    var find = service.app.db.models.Request.find();
    find.where({ 'status.deleted': params['status.deleted'] });

    if (params.user)
    {
         find.where({ 'user.id': params.user });
    }

    find.populate('absence.distribution');
    find.populate('events');

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

        var find = query(service, params)
            .select('user timeCreated createdBy events absence time_saving_deposit workperiod_recover approvalSteps')
            .sort('timeCreated');
        

        service.resolveQuery(find, paginate);

        return service.deferred.promise;
    };
    
    
    return service;
};




