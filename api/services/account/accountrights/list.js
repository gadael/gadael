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
     * @param {Array}    rights array of mongoose documents
     * @param {Date}     dtstart
     * @param {Date}     dtend
     */
    function resolveAccountRights(user, rights, dtstart, dtend)
    {
        var async = require('async');
        
        /**
         * Get the promise for the available quantity
         * @param   {Right} right
         * @param   {RightRenewal} renewal
         * @returns {Promise} resolve to a number
         */
        function getRenewalAvailableQuantity(right, renewal) {

            if (!right.validateRules(renewal, user, dtstart, dtend)) {
                return null;
            }

            if (user.roles.account.arrival > renewal.finish) {
                return null;
            }

            return renewal.getUserAvailableQuantity(user);
        }








        var output = [];


        /**
         * add renewals into the right object
         * @param {Right} rightDocument
         * @param {object} right
         * @param {Array} renewals
         * @param {function} callback
         */
        function processRenewals(rightDocument, right, renewals, callback)
        {
            async.each(renewals, function(renewalDocument, renewalCallback) {
                var p = getRenewalAvailableQuantity(rightDocument, renewalDocument);

                if (null === p) {
                    // no error but the right is discarded in this renewal because of the rules or missing renewal
                    return renewalCallback();
                }

                p.then(function(quantity) {

                    var renewalObj = renewalDocument.toObject();
                    renewalObj.available_quantity = quantity;
                    right.renewals.push(renewalObj);
                    right.available_quantity += quantity;

                    renewalCallback();

                }, renewalCallback);

            }, callback);
        }


        async.each(rights, function(rightDocument, cb) {

            var right = rightDocument.toObject();
            right.disp_unit = rightDocument.getDispUnit();

            
            rightDocument.getAllRenewals().then(function(renewals) {

                /**
                 * Store available quantity for each accessibles renewals
                 * renewals with right rules not verified will not be included
                 */
                right.renewals = [];

                /**
                 * Sum of quantities from the accessibles renewals
                 */
                right.available_quantity = 0;

                processRenewals(rightDocument, right, renewals, function done(err) {

                    if (err) {
                        return cb(err);
                    }

                    if (right.renewals.length > 0) {
                        right.available_quantity_dispUnit = rightDocument.getDispUnit(right.available_quantity);
                        output.push(right);
                    }

                    cb();
                });

            });


        }, function(err) {

            if (err) {
                return service.error(err);
            }

            service.outcome.success = true;
            service.deferred.resolve(output);
        });
    }
    
    
    
    /**
     * Populate type in all rights
     * @param {Array} rights
     * @return {Promise}
     */
    function populateTypes(rights) {
        let promisedPopulate = [];

        // populate right.type
        rights.forEach(right => {
            promisedPopulate.push(right.populate('type').execPopulate());
        });

        return Promise.all(promisedPopulate);
    }
    
    
    
    /**
     * Update groupTitle property with name if not set in type document
     * @param {Array} rights
     */
    function addTypesGroupTitle(rights) {
        rights.forEach(right => {
            right.type.groupTitle = right.type.getGroupTitle();
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
                    populateTypes(rights).then(() => {
                        addTypesGroupTitle(rights);
                        resolveAccountRights(users[0], rights, params.dtstart, params.dtend);
                    }).catch(service.error);

                }).catch(service.notFound);
                
            } else {
                service.notFound('User not found for '+params.user);
            }
        });
        
        
        return service.deferred.promise;
    };
    
    
    return service;
};




