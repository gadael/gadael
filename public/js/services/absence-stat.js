define(['momentDurationFormat', 'q'], function(moment, Q) {

    'use strict';

    return function setStats($scope) {

        $scope.stat = {
            consumed: {
                D: 0,
                H: 0
            },
            duration: {
                D: 0,
                H: 0
            }
        };

        $scope.request.$promise.then(function() {
            var elem;
            for(var i=0; i<$scope.request.absence.distribution.length; i++) {
                elem = $scope.request.absence.distribution[i];

                $scope.stat.consumed[elem.right.quantity_unit] += elem.consumedQuantity;
                $scope.stat.duration[elem.right.quantity_unit] += elem.quantity;
            }
        });
    }
});
