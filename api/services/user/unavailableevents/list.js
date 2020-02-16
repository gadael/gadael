'use strict';


const requestdateparams = require('../../../../modules/requestdateparams');



/**
 *
 * @param {listItemsService} service
 * @param {array} params      query parameters if called by controller
 *
 * @return {Query}
 */
function getEvents(service, params)
{
    if (undefined === params.user) {
        throw new Error('The user parameter is mandatory in the unavailableevents service');
    }


    var find = service.app.db.models.Account.find();
    find.where('user.id', params.user);
    return find.exec().then(function(accountDocument) {

        if (0 === accountDocument.length) {
            throw new Error('No account found for '+params.user);
        }

        return accountDocument[0].getPeriodUnavailableEvents(params.dtstart, params.dtend);
    });
}







/**
 * Create the service
 * @param   {Object} services
 * @param   {Object} app
 * @returns {listItemsService}
 */
exports = module.exports = function(services, app) {

    var service = new services.list(app);

    /**
     * Call the unavailable events list service
     *
     *
     * @param {Object} params
     *                      params.dtstart                  search interval start
     *                      params.dtend                    serach interval end
     *                      params.user                     user ID to search in
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        var checkParams = requestdateparams(app);

        if (!checkParams(service, params)) {
            return service.deferred.promise;
        }

        getEvents(service, params)
        .then(function(era) {
            return service.deferred.resolve(era.periods);
        })
        .catch(service.error);


        return service.deferred.promise;
    };


    return service;
};
