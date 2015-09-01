define([], function() {
    
    'use strict';

    /**
     * Save one row
     * @param   {$resource}   resource
     * @returns {Promise}
     */
    var saveRow = function($q, resource) {
        
        var deferred = $q.defer();
        
        if (resource._id) {

            resource.$save(function(data) {
                deferred.resolve(data);
            });
            
        } else {
            resource.$create(function(data) {
                deferred.resolve(data);
            });
        }

        return deferred.promise;
    };
    
    
    
    /**
     * Save all account collections
     * 
     */
    return function($scope, $q, catchOutcome) {


        if (!$scope.user.roles || !$scope.user.roles.account) {
            // TODO remove the existing collections
            return;
        }

        var promises = [];


        $scope.accountCollections.forEach(function(document) {
            
            if ($scope.user.roles && $scope.user.roles.account) {
                document.account = $scope.user.roles.account;
            } else {
                document.user = $scope.user._id;
            }

            promises.push(catchOutcome(saveRow($q, document)));
        });

        var promise = $q.all(promises);

        return promise;
    };
});
