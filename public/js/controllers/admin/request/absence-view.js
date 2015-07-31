define([], function() {
    'use strict';
    
	return ['$scope', 
		'$location', 
		'Rest',
        'AbsenceStat', function(
			$scope, 
			$location, 
			Rest,
            AbsenceStat
		) {
                

		$scope.request = Rest.admin.requests.getFromUrl().loadRouteId();

        AbsenceStat($scope);

        $scope.edit = function() {
            $location.path('/admin/requests/absence-edit/'+$scope.request._id);
        };
        
        /**
         * Cancel the absence request
         */
		$scope.delete = function() {
            if (confirm('Are you sure you whant to delete the absence request?')) {
                $location.path('/admin/requests');
            }

		};

	}];
});

