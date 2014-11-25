define([], function() {
    
    'use strict';

	return ['$scope', '$location', 'Rest', function($scope, $location, Rest) {

		$scope.request = Rest.admin.requests.getFromUrl().loadRouteId();

        $scope.back = function() {
            $location.path('/admin/requests');
        }
		
		$scope.saveRequest = function() {
			$scope.request.ingaSave($scope.back);
	    };
	}];
});

