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
             * @param {string} message
             */
            function addPageAlert(message) {
                if (undefined === $rootScope.pageAlerts) {
                    $rootScope.pageAlerts = [];
                }

                $rootScope.pageAlerts.push({ type: 'danger', message: message });

            }


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

                    if (null === data) {
                        addPageAlert('No response from server');
                        return deferred.resolve(null);
                    }

                    // accept promises with a data object or a response object with the data property
                    if (undefined !== data.data) {
                        data = data.data;
                    }

                    if (data.$outcome) {
                        addMessages(data.$outcome);
                    }
                    
                    // workflow return the saved document object
                    // value is fowarded to the next promise on success
                    deferred.resolve(data);
                    
                },
                function(badRequest) {
                    
                    var data = badRequest.data;

                    if (null === data) {
                        addPageAlert('No response from server');
                        return  deferred.reject(null);
                    }

                    var outcome = data.$outcome;
                    
                    if (!outcome) {
                        return deferred.reject(data);
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
