'use strict';


/**
 * The user account rights list service
 * Get available rights beetween two dates
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
    function resolveAccountRights(user, rights, dtstart, dtend)
    {
        var Q = require('q');
        var async = require('async');
        
        /**
         * Get the promise for the available quantity
         * @param   {Right} right
         * @param   {RightRenewal} renewal
         * @returns {Promise} resolve to a number
         */
        function getRenewalAvailableQuantity(right, renewal) {

            if (null === renewal) {
                return Q.fcall(function () {
                    // default available quantity if no renewal
                    return 0;
                });
            }

            
            if (!right.validateRules(renewal, user, dtstart, dtend)) {
                return Q.fcall(function () {
                    // default available quantity for non appliquables rights
                    return 0;
                });
            }

            return renewal.getUserAvailableQuantity(user);
        }





        async.map(rights, function(rightDocument, cb) {

            var right = rightDocument.toObject();
            right.disp_unit = rightDocument.getDispUnit();
            
            rightDocument
                .getPeriodRenewal(dtstart, dtend)
                .then(function(renewal) {
            
                getRenewalAvailableQuantity(rightDocument, renewal).then(function(quantity) {
                    right.available_quantity = quantity;
                    right.available_quantity_dispUnit = rightDocument.getDispUnit(quantity);

                    cb(null, right);
                });
            });


        }, function(err, output) {

            service.outcome.success = true;
            service.deferred.resolve(output);
        });
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    /**
     * Call the account rights list service
     * 
     * @param {Object} params
     * 
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        
        if (params.dtstart) {
            params.dtstart = new Date(params.dtstart);
        }

        if (params.dtend) {
            params.dtend = new Date(params.dtend);
        }
        

        var checkParams = require('../../../../modules/requestdateparams');
        
        if (!checkParams(service, params)) {
            return service.deferred.promise;   
        }


        // get user account document for the user param
        
        service.app.db.models.User.find({ _id: params.user }).populate('roles.account').exec(function(err, users) {
            
            if (service.handleMongoError(err)) {

                if (0 === users.length) {
                    return service.notFound('User not found for '+params.user);
                }
                
                var account = users[0].roles.account;

                if (!account) {
                    return service.notFound('Account not found for user');
                }

                account.getRights().then(function(rights) {

                    resolveAccountRights(users[0], rights, params.dtstart, params.dtend);
                }).catch(service.notFound);
                
            } else {
                service.notFound('User not found for '+params.user);
            }
        });
        
        
        return service.deferred.promise;
    };
    
    
    return service;
};




