'use strict';




/**
 * Create the query with filters
 * 
 * @param {listItemsService} service
 * @param {array} params      query parameters if called by controller
 *
 * @return {Query}
 */
var query = function(service, params) {

    var find = service.app.db.models.AccountScheduleCalendar.find();
    find.populate('calendar');

    if (undefined === params.account) {
        throw new Error('The account parameter is mandatory in the account schedule calendar service');
    }

    find.where({ account: params.account });

    if (params && params.calendar) {
        find.where({ calendar: params.calendar });
    }

    return find;
};



/**
 * The Admin account schedule calendar list service
 * @param   {Object} services  base classes from apiService
 * @param   {express|object} app      express or headless app
 * @returns {listItemsService}
 */
exports = module.exports = function(services, app) {
    
    var service = new services.list(app);
    
    /**
     * Call the AccountScheduleCalendar list service
     * 
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params, paginate) {
          
        var find = query(service, params);
        find.select('account calendar from to');
        find.sort('from');
        
        service.resolveQuery(find, paginate);

        return service.deferred.promise;
    };
    
    
    return service;
};




