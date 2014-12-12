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
     * @param {Array} beneficiaries array of mongoose documents
     */
    function resolveBeneficiaries(user, beneficiaries)
    {
        var right, currentRenewal, user;
        var output = [];
        
        for(var i=0; i<beneficiaries.length; i++) {
            right = beneficiaries[i].toObject();
            right.disp_unit = beneficiaries[i].getDispUnit();
            currentRenewal = beneficiaries[i].getCurrentRenewal();
            right.available_quantity = currentRenewal.getUserAvailableQuantity(user);
            
            output.push(right);
        }
        
        service.outcome.success = true;
        service.deferred.resolve(output);
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

                account.getRights().then(function(beneficiaries) {
                    resolveBeneficiaries(users[0], beneficiaries);
                }).catch(service.notFound);
                
            } else {
                service.notFound('User not found for '+params.user);
            }
        });
        
        
        return service.deferred.promise;
    };
    
    
    return service;
};




