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

            resource.$save(deferred.resolve, deferred.reject);
            
        } else {
            resource.$create(deferred.resolve, deferred.reject);
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


        $scope.accountScheduleCalendars.forEach(function(document) {

            if ($scope.user.roles && $scope.user.roles.account) {
                document.account = $scope.user.roles.account._id;
            } else {
                document.user = $scope.user._id;
            }
            
            promises.push(catchOutcome(saveRow($q, document)));
        });

        var promise = $q.all(promises);

        return promise;
    };
});
