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
            },function(data) {
                deferred.reject(data);
            });
            
        } else {
            resource.$create(function(data) {
                deferred.resolve(data);
            },function(data) {
                deferred.reject(data);
            });
        }

        return deferred.promise;
    };
    
    
    
    /**
     * Save all beneficiaries
     * 
     */
    return function($scope, collectionId, $q, catchOutcome) {

        var promises = [];

        $scope.collectionRights.forEach(function(resource) {
            
            resource.document = collectionId;
            resource.ref = 'RightCollection';

            promises.push(catchOutcome(saveRow($q, resource)));
        });

        var promise = $q.all(promises);

        return promise;
    };
});
