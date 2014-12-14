'use strict';


/**
 * The user account rights list service
 */






/**
 * Create the service
 * @param   {Object} services
 * @param   {Object} app
 * @returns {listItemsService}
 */
exports = module.exports = function(services, app)
{
    
    var service = new services.list(app);
    
    
    
    
    /**
     * 
     * @param {Document} user
     * @param {Array} rights array of mongoose documents
     */
    function resolveAccountRights(user, rights)
    {
        var Q = require('q');
        var right, available_quantity_promise;
        var output = [];
        var available_quantity_promises = [];
        
        
        /**
         * Get the promise for the available quantity
         * @param   {Document} renewal
         * @returns {[[Type]]} [[Description]]
         */
        function getRenewalAvailableQuantity(renewal) {

            if (null === renewal) {
                return Q.fcall(function () {
                    // default available quantity if no renewal
                    return 0;
                });
            }

            return renewal.getUserAvailableQuantity(user);
        }
        
        // create an array of promises
        for(var i=0; i<rights.length; i++) {
            right = rights[i].toObject();
            right.disp_unit = rights[i].getDispUnit();
            available_quantity_promise = rights[i].getCurrentRenewal().then(getRenewalAvailableQuantity);
            
            available_quantity_promises.push(available_quantity_promise);
            
            output.push(right);
        }
        
        
        Q.all(available_quantity_promises).then(function(available_quantity_arr) {

            if (available_quantity_arr.length !== output.length) {
                return service.notFound('Internal error, number of computed quantites does not match with the rights count');
            }
            
            for(var i=0; i<available_quantity_arr.length; i++) {
                output[i].available_quantity = available_quantity_arr[i];
                output[i].available_quantity_dispUnit = rights[i].getDispUnit(available_quantity_arr[i]);
            }
            
            service.outcome.success = true;
            service.deferred.resolve(output);
            
        }).catch(service.notFound);
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    /**
     * Call the calendar events list service
     * 
     * @param {Object} params
     * 
     *
     * @return {Promise}
     */
    service.call = function(params) {
        
        params.dtstart = new Date(params.dtstart);
        params.dtend = new Date(params.dtend);
        
        
        var checkParams = require('../../../../modules/requestdateparams');
        
        if (!checkParams(service, params)) {
            return service.deferred.promise;   
        }
        

        // get user account document for the user param
        
        service.models.User.find({ _id: params.user }).populate('roles.account').exec(function(err, users) {
            
            if (service.handleMongoError(err)) {

                if (0 === users.length) {
                    return service.notFound('User not found for '+params.user);
                }
                
                var account = users[0].roles.account;

                if (!account) {
                    return service.notFound('Account not found for user');
                }

                account.getRights().then(function(rights) {
                    resolveAccountRights(users[0], rights);
                }).catch(service.notFound);
                
            } else {
                service.notFound('User not found for '+params.user);
            }
        });
        
        
        return service.deferred.promise;
    };
    
    
    return service;
};




