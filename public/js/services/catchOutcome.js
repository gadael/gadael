define(function() {

    'use strict';
    
    /**
     * Create the catchOutcome function
     * 
     * @param   {object} angular    
     * @param   {object} $rootScope Angular rootscope needed to attach the messages
     * @param   {object} $q         Q promise factory from angular
     * @returns {catchOutcome}
     */
    function createCatchOutcome(angular, $rootScope, $q) {
    


        
        /**
         * catchOutcome, this will be used as a service
         * @param promise
         * @return promise
         */
        return function catchOutcome(promise) {


            /**
             * Add messages to the rootScope
             * @todo remove duplication with controller/login/index.js
             * @param {Object} outcome
             */
            function addMessages(outcome) {

                if (undefined === $rootScope.pageAlerts) {
                    $rootScope.pageAlerts = [];
                }

                for(var i=0; i<outcome.alert.length; i++) {
                    $rootScope.pageAlerts.push(outcome.alert[i]);
                }
            }


            
            var deferred = $q.defer();
            
            promise.then(
                function(data) {
                    if (data.$outcome) {
                        addMessages(data.$outcome);
                    }
                    
                    // workflow return the saved document object
                    // value is fowarded to the next promise on success
                    deferred.resolve(data);
                    
                },
                function(badRequest) {
                    
                    var data = badRequest.data;
                    var outcome = data.$outcome;
                    
                    if (!outcome) {
                        return;
                    }
                    
                    addMessages(outcome);

                    // receive 400 bad request on missing parameters
                    // mark required fields
                    
                    for(var fname in outcome.errfor) {
                        if ('required' === outcome.errfor[fname]) {
                            var fieldOnError = angular.element(document.querySelector('[ng-model$='+fname+']')).parent();
                            fieldOnError.addClass('has-error');
                            
                            if (0 === fieldOnError.length) {
                                alert('missing field: '+fname);
                            }
                        }
                    }
                    
                    deferred.reject(data);
                }
            );
            
            
            return deferred.promise;
        };
        
        
    }
    
    return createCatchOutcome;

});
