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
            // TODO remove the existing non working days calendars
            return;
        }

        var promises = [];


        $scope.accountNWDaysCalendars.forEach(function(document) {

            // remove time on dates before saving

            if (document.from instanceof Date) {
                document.from.setHours(0,0,0,0);
            }

            if (document.to instanceof Date) {
                document.to.setHours(0,0,0,0);
            }

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
